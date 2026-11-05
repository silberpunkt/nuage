<?php
/**
 * patty.php -- patty-cake's janitor, the sibling of __demo/engine.php. Lets the Nuage page run a patty-cake job on
 * this machine's card, notice it after a reload, cancel it, rule on its cards, and rebuild Nuage, so nobody need sit at
 * a console. Served by the repo's own serve.php (php -S localhost:8080 serve.php), so the page and this file share an
 * origin; open Nuage at http://localhost:8080/__nuage/dist/nuage.html.
 *
 *   patty.php?do=status              -> {engine: bool, job: {...} | null, running: bool, waiting: n}
 *   patty.php?do=start&n=200[&rest=1][&templates=1][&talks=1]
 *                                    -> spawns node patty/patty.js --n N --job patty/job.json, windowless, logged
 *   patty.php?do=stop                -> ends the running job (taskkill by the PID the job wrote)
 *   patty.php?do=cards               -> the waiting cards, each {card, notes}
 *   patty.php?do=rule&card=...&keep=1|0[&amend=(comment X "what it should say")]
 *                                    -> keeps a waiting card (to kb/taught.kb) or drops it (to patty/dropped.kb)
 *   patty.php?do=pack                -> rebuilds Nuage (node pack/pack.js); the page then reloads itself
 *   patty.php?do=fetch               -> brings llama.cpp home (patty/fetch-llama.ps1), for the larger engines
 *   patty.php?do=lstart&model=impeccable|fantastic
 *                                    -> starts llama-server with that model (fetched on first start, into __libs/models)
 *   patty.php?do=lstop               -> rests llama-server
 *   patty.php?do=ask   (POST JSON)   -> one message to whichever engine is lit; {reply}
 *   patty.php?do=pupil (POST JSON)   -> the watched pupil: {step: topic|ask|verdict, topic, talk, seed}; {reply}
 *   patty.php?do=misses (POST JSON)  -> a watched pupil's missed questions, added to test/candidates.txt
 *   patty.php?do=start&mirror=1&n=N  -> the mirror: the lit model's answers to N plain questions, into patty/mimia/light.jsonl
 *   patty.php?do=grind[&epochs=12]   -> grinds Mimia against the light (python patty/mimia/grind.py), into mimia.bin
 *   patty.php?do=words               -> fetches the word libraries (python words/fetch_words.py) into __libs/words
 *   patty.php?do=simplewiki          -> fetches a shard of Simple English Wikipedia (words/fetch_simplewiki.py), never shipped
 *   patty.php?do=word&w=juxtaposition -> one word, torn down (node words/teardown.js): {tear, card}
 *   patty.php?do=cuts                -> the four cuts of Nuage (node pack/cuts.js), into dist/cuts
 *
 * Fixed verbs only. A request's words are never run: numbers are read as numbers, and a card is acted on only if it is,
 * character for character, one of the cards already waiting. And, like the engine's janitor, it answers only to the
 * house: local callers, no exceptions.
 */

declare(strict_types=1);
header('Content-Type: application/json');
const J = JSON_INVALID_UTF8_SUBSTITUTE;              // a log line in a strange code page must not silence the whole answer

$addr = $_SERVER['REMOTE_ADDR'] ?? '';
if ($addr !== '127.0.0.1' && $addr !== '::1') {
    http_response_code(403);
    exit(json_encode(['error' => 'patty-cake answers only to the house']));
}

$here  = __DIR__;                                  // __nuage/patty
$root  = dirname($here);                           // __nuage
$jobF  = $here . DIRECTORY_SEPARATOR . 'job.json';
$propF = $here . DIRECTORY_SEPARATOR . 'proposed.kb';
$dropF = $here . DIRECTORY_SEPARATOR . 'dropped.kb';
$taugF = $root . DIRECTORY_SEPARATOR . 'kb' . DIRECTORY_SEPARATOR . 'taught.kb';
$node  = getenv('NUAGE_NODE') ?: 'node';           // node on the PATH, unless NUAGE_NODE names another
$libs  = dirname($root) . DIRECTORY_SEPARATOR . '__libs';   // __mylar-lm/__libs
$llamaDir = $libs . DIRECTORY_SEPARATOR . 'llama.cpp';
$llamaLog = $here . DIRECTORY_SEPARATOR . 'llama.log';
$fetchLog = $here . DIRECTORY_SEPARATOR . 'llama-fetch.log';
$modelF   = $here . DIRECTORY_SEPARATOR . 'llama.model';
// the larger engines, by role: (a) impeccable, for judging, filling blanks and writing cards; (b) fantastic, for the pupil
$MODELS = [
    'impeccable' => ['name' => 'Qwen3.5 9B', 'hf' => 'unsloth/Qwen3.5-9B-GGUF:Q4_K_M'],
    'fantastic'  => ['name' => 'Gemma 4 E4B', 'hf' => 'ggml-org/gemma-4-E4B-it-GGUF:Q4_0'],
];
$do    = $_GET['do'] ?? 'status';

// Start a program and let it go. A single-threaded janitor (php -S) must never wait on what it starts: popen with
// "start /B" leaves the child holding the pipe, and the janitor then answers nothing until the child ends (a download,
// or a server that runs for hours). proc_open with every stream sent to NUL holds nothing. popen is kept as a fallback.
function spawn(string $cmd, string $cwd, string $fallback): void
{
    $p = @proc_open($cmd, [0 => ['file', 'NUL', 'r'], 1 => ['file', 'NUL', 'w'], 2 => ['file', 'NUL', 'w']], $pipes, $cwd, null, ['bypass_shell' => true, 'create_process_group' => true]);
    if (!is_resource($p)) { chdir($cwd); pclose(popen($fallback, 'r')); }
}

function portAlive(int $p): bool
{
    $c = @fsockopen('127.0.0.1', $p, $errno, $errstr, 0.4);
    if ($c) { fclose($c); return true; }
    return false;
}
function llamaReady(): bool                         // llama-server opens its port before its model is loaded: ready is /health "ok"
{
    if (!portAlive(8178)) { return false; }
    $r = @file_get_contents('http://127.0.0.1:8178/health', false, stream_context_create(['http' => ['timeout' => 1, 'ignore_errors' => true]]));
    $j = $r ? json_decode($r, true) : null;
    return is_array($j) && ($j['status'] ?? '') === 'ok';
}
function engineAlive(): bool { return portAlive(8177) || llamaReady(); }   // the classic engine room, or llama-server, ready
function fetchingBytes(string $dir): int            // a model on its way: llama-server writes *.downloadInProgress as it fetches
{
    if (!is_dir($dir)) { return 0; }
    $n = 0;
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)) as $f) { if (substr($f->getFilename(), -18) === 'downloadInProgress') { $n += $f->getSize(); } }
    return $n;
}
function llamaExe(string $d): ?string
{
    foreach (array_merge([$d . DIRECTORY_SEPARATOR . 'llama-server.exe'], glob($d . '/*/llama-server.exe') ?: []) as $f) { if (is_file($f)) { return $f; } }
    return null;
}
function llamaProc(): bool { return stripos((string) @shell_exec('tasklist /FI "IMAGENAME eq llama-server.exe" /NH 2>&1'), 'llama-server') !== false; }
function lastLine(string $f): string
{
    if (!is_file($f)) { return ''; }
    $n = filesize($f); $t = (string) file_get_contents($f, false, null, max(0, $n - 4000));
    $ls = array_values(array_filter(array_map('trim', preg_split('/[\r\n]+/', $t)), 'strlen'));
    return $ls ? (string) end($ls) : '';
}
function post(string $url, array $body): array
{
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => json_encode($body), 'timeout' => 180, 'ignore_errors' => true]]);
    $r = @file_get_contents($url, false, $ctx);
    if ($r === false) { return ['error' => 'the engine did not answer']; }
    $j = json_decode($r, true);
    return is_array($j) ? $j : ['error' => 'the engine answered, not in JSON'];
}

function engineAsk(array $msgs, float $t, int $n, int $sd): array   // one message to whichever engine is lit
{
    if (llamaReady()) {
        $r = post('http://127.0.0.1:8178/v1/chat/completions', ['messages' => $msgs, 'temperature' => $t, 'max_tokens' => $n, 'seed' => $sd, 'chat_template_kwargs' => ['enable_thinking' => false]]);
        $reply = $r['choices'][0]['message']['content'] ?? null;
    } elseif (portAlive(8177)) {
        $r = post('http://127.0.0.1:8177/chat', ['messages' => $msgs, 'temperature' => $t, 'max_new_tokens' => $n, 'sampler_seed' => $sd]);
        $reply = $r['reply'] ?? null;
    } else { return ['error' => 'the engine is dark']; }
    if ($reply === null) { return ['error' => $r['error'] ?? 'the engine gave no reply']; }
    return ['reply' => trim((string) preg_replace('/<think>[\s\S]*?<\/think>/', '', (string) $reply))];
}

function job(string $f): ?array
{
    if (!is_file($f)) { return null; }
    $j = json_decode((string) file_get_contents($f), true);
    return is_array($j) ? $j : null;
}

function pidAlive(int $pid): bool
{
    if ($pid <= 0) { return false; }
    $out = (string) @shell_exec('tasklist /FI "PID eq ' . $pid . '" /NH 2>&1');
    return stripos($out, 'node') !== false;
}

function pythonExe(string $root): string             // the demo's venv, which has numpy; else python on the PATH
{
    foreach ([dirname($root) . '\\__demo\\.venv\\Scripts\\python.exe', getenv('NUAGE_PYTHON') ?: ''] as $p) { if ($p !== '' && is_file($p)) { return $p; } }
    return 'python';
}
function mimiaGrinding(string $here): bool           // grind.log still being written, and not yet done
{
    $f = $here . DIRECTORY_SEPARATOR . 'mimia' . DIRECTORY_SEPARATOR . 'grind.log';
    return is_file($f) && time() - filemtime($f) < 120 && !preg_match('/grind: done|Traceback|Error/', (string) @file_get_contents($f));
}
function mimiaStatus(string $here): array
{
    $d = $here . DIRECTORY_SEPARATOR . 'mimia' . DIRECTORY_SEPARATOR;
    $light = is_file($d . 'light.jsonl') ? count(file($d . 'light.jsonl', FILE_SKIP_EMPTY_LINES)) : 0;
    $log = is_file($d . 'grind.log') ? trim((string) @file_get_contents($d . 'grind.log')) : '';
    $last = $log === '' ? '' : substr(strrchr("\n" . $log, "\n"), 1);
    return ['light' => $light, 'grinding' => mimiaGrinding($here), 'log' => substr($last, -200), 'bin' => is_file($d . 'mimia.bin') ? filesize($d . 'mimia.bin') : 0,
        'meta' => is_file($d . 'mimia.json') ? json_decode((string) file_get_contents($d . 'mimia.json'), true) : null];
}

function wordsStatus(string $root): array
{
    $wl = $root . DIRECTORY_SEPARATOR . 'words' . DIRECTORY_SEPARATOR . 'fetch.log';
    $log = is_file($wl) ? trim((string) @file_get_contents($wl)) : '';
    $last = $log === '' ? '' : substr(strrchr("\n" . $log, "\n"), 1);
    return ['fetched' => is_dir(dirname($root) . DIRECTORY_SEPARATOR . '__libs' . DIRECTORY_SEPARATOR . 'words' . DIRECTORY_SEPARATOR . 'wn'),
        'fetching' => $log !== '' && !preg_match('/^(done|failed)/m', $log) && time() - filemtime($wl) < 300, 'log' => substr($last, -200)];
}

function blocks(string $f): array                  // the waiting cards: comment lines, then the card itself
{
    if (!is_file($f)) { return []; }
    $out = []; $notes = [];
    foreach (preg_split('/\r?\n/', (string) file_get_contents($f)) as $l) {
        if (trim($l) === '') { continue; }
        if ($l[0] === '(') { $out[] = ['card' => $l, 'notes' => $notes]; $notes = []; }
        else { $notes[] = $l; }
    }
    return $out;
}

function running(?array $j): bool
{
    if ($j === null || !in_array($j['state'] ?? '', ['starting', 'writing questions', 'running'], true)) { return false; }
    if ((int) ($j['pid'] ?? 0) === 0) { return time() - (int) ($j['since'] ?? 0) < 20; }   // spawned, and not yet signed in
    return pidAlive((int) $j['pid']);
}

switch ($do) {
    case 'status':
        $j = job($jobF);
        if ($j !== null && !running($j) && in_array($j['state'] ?? '', ['starting', 'writing questions', 'running'], true)) {
            $j['state'] = 'stopped';                     // it was running and is gone: say so, and remember it
            @file_put_contents($jobF, json_encode($j));
        }
        $fl = lastLine($fetchLog); $m = is_file($modelF) ? trim((string) file_get_contents($modelF)) : '';
        echo json_encode(['engine' => engineAlive(), 'classic' => portAlive(8177), 'job' => $j, 'running' => running($j), 'waiting' => count(blocks($propF)), 'mimia' => mimiaStatus($here), 'words' => wordsStatus($root),
            'llama' => ['installed' => llamaExe($llamaDir) !== null, 'fetching' => is_file($fetchLog) && !preg_match('/^(done|failed)/', $fl) && time() - filemtime($fetchLog) < 900, 'fetch' => $fl,
                'lit' => ($ready = llamaReady()), 'loading' => !$ready && ($proc = llamaProc()),
                'stage' => $ready ? 'lit' : (!$proc ? '' : (($dl = fetchingBytes($libs . DIRECTORY_SEPARATOR . 'models')) > 0 ? 'fetching' : (portAlive(8178) ? 'waking' : 'loading'))), 'got' => $dl ?? 0, 'model' => $m, 'name' => $MODELS[$m]['name'] ?? '', 'log' => substr(lastLine($llamaLog), -160), 'logAge' => is_file($llamaLog) ? time() - filemtime($llamaLog) : -1]], J);
        break;

    case 'start':
        if (running(job($jobF))) { echo json_encode(['ok' => false, 'note' => 'a job is already running']); break; }
        $n = (int) ($_GET['n'] ?? 200); $mir = ($_GET['mirror'] ?? '') === '1';
        if ($n < 10 || $n > ($mir ? 20000 : 2000)) { echo json_encode(['ok' => false, 'error' => 'n must be between 10 and ' . ($mir ? 20000 : 2000)]); break; }
        $flags = ' --n ' . $n . ' --job patty\\job.json';   // no spaces, so no inner quotes for cmd to misread
        if (($_GET['rest'] ?? '') === '1') { $flags .= ' --then-stop'; }
        if (($_GET['templates'] ?? '') === '1') { $flags .= ' --templates-only'; }
        if (($_GET['talks'] ?? '') === '1') { $flags .= ' --talks'; }
        if ($mir) { $flags .= ' --mirror'; }   // Mimia's light: the lit model's answers to plain questions
        if (llamaReady()) { $flags .= ' --url http://localhost:8178 --llama'; }   // the larger engine, when it is the one lit   // conversations: the model plays a pupil, a few turns each
        if (!engineAlive() && ($_GET['templates'] ?? '') !== '1') { echo json_encode(['ok' => false, 'error' => 'the engine is dark: start it first']); break; }
        @file_put_contents($jobF, json_encode(['state' => 'starting', 'pid' => 0, 'n' => $n, 'since' => time()]));
        chdir($root);
        $run = '"' . $node . '" patty\\patty.js' . $flags . ' > patty\\job.log 2>&1';
        spawn('cmd /c "' . $run . '"', $root, 'start "nuage-patty" /B cmd /c "' . $run . '"');
        echo json_encode(['ok' => true, 'note' => 'patty-cake is starting']);
        break;

    case 'grind':                                    // grind Mimia against the light (patty/mimia/grind.py, Python and numpy)
        if (running(job($jobF)) || mimiaGrinding($here)) { echo json_encode(['ok' => false, 'note' => 'a job is already running']); break; }
        $light = $here . DIRECTORY_SEPARATOR . 'mimia' . DIRECTORY_SEPARATOR . 'light.jsonl';
        if (!is_file($light)) { echo json_encode(['ok' => false, 'error' => 'there is no light yet: run the mirror first']); break; }
        $py = pythonExe($root);
        $ep = max(1, min(60, (int) ($_GET['epochs'] ?? 12)));
        $un = in_array((int) ($_GET['units'] ?? 512), [512, 1024, 2048], true) ? (int) $_GET['units'] : 512;   // 512 units: about 127 KB; 2048: about 500 KB, its first 128 KB a core
        chdir($root);
        $run = '"' . $py . '" patty\\mimia\\grind.py --epochs ' . $ep . ' --units ' . $un . ' > patty\\mimia\\grind.log 2>&1';
        spawn('cmd /c "' . $run . '"', $root, 'start "nuage-mimia" /B cmd /c "' . $run . '"');
        echo json_encode(['ok' => true, 'note' => 'Mimia is being ground', 'python' => $py]);
        break;

    case 'words':                                    // brings the outer word libraries home (words/fetch_words.py), into __libs/words
        $wl = $root . DIRECTORY_SEPARATOR . 'words' . DIRECTORY_SEPARATOR . 'fetch.log';
        if (is_file($wl) && time() - filemtime($wl) < 300 && !preg_match('/^(done|failed)/m', (string) @file_get_contents($wl))) { echo json_encode(['ok' => false, 'note' => 'the word libraries are already being fetched']); break; }
        $py = pythonExe($root); chdir($root); @file_put_contents($wl, "Starting.\n");
        $run = '"' . $py . '" words\\fetch_words.py >> words\\fetch.out 2>&1';
        spawn('cmd /c "' . $run . '"', $root, 'start "nuage-words" /B cmd /c "' . $run . '"');
        echo json_encode(['ok' => true, 'note' => 'fetching the word libraries']);
        break;

    case 'simplewiki':                               // a shard of Simple English Wikipedia, on the machine and never shipped (words/fetch_simplewiki.py)
        $sw = $root . DIRECTORY_SEPARATOR . '__no-copy' . DIRECTORY_SEPARATOR . '__sources' . DIRECTORY_SEPARATOR . 'wp--simple-english';
        $sl = $sw . DIRECTORY_SEPARATOR . 'fetch.out';
        if (is_file($sl) && time() - filemtime($sl) < 120) { echo json_encode(['ok' => false, 'note' => 'the shard is already being fetched or distilled']); break; }
        @mkdir($sw, 0777, true); $py = pythonExe($root); chdir($root);
        $run = '"' . $py . '" words\\fetch_simplewiki.py >> "' . $sl . '" 2>&1';
        spawn('cmd /c "' . $run . '"', $root, 'start "nuage-simplewiki" /B cmd /c "' . $run . '"');
        echo json_encode(['ok' => true, 'note' => 'fetching Simple English Wikipedia: about 300 MB, then distilled to one line an article']);
        break;

    case 'word':                                     // one word, torn down (words/teardown.js); the word is checked, never run
        $w = (string) ($_GET['w'] ?? '');
        if (!preg_match("/^[A-Za-z][A-Za-z'\\-]{0,47}$/", $w)) { echo json_encode(['ok' => false, 'error' => 'one word, of letters, please']); break; }
        chdir($root);
        if (!is_file($root . DIRECTORY_SEPARATOR . 'words' . DIRECTORY_SEPARATOR . 'yowl-canon.json')) { @exec('"' . $node . '" words\\canon.js 2>&1'); }
        $out = []; @exec('"' . $node . '" words\\teardown.js --json ' . escapeshellarg($w) . ' 2>&1', $out);
        $t = json_decode(implode("\n", $out), true);
        $card = []; @exec('"' . $node . '" words\\teardown.js ' . escapeshellarg($w) . ' 2>&1', $card);
        echo json_encode(['ok' => is_array($t), 'tear' => $t, 'card' => trim(implode("\n", $card)), 'raw' => is_array($t) ? null : implode("\n", $out)], J);
        break;

    case 'stop':
        $j = job($jobF);
        $pid = (int) ($j['pid'] ?? 0);
        if (!running($j)) { echo json_encode(['ok' => true, 'note' => 'no job is running']); break; }
        @exec('taskkill /F /PID ' . $pid . ' 2>&1');
        usleep(300000);
        $j['state'] = 'stopped'; $j['finished'] = date('c');
        @file_put_contents($jobF, json_encode($j));
        echo json_encode(['ok' => !pidAlive($pid), 'note' => 'stopped']);
        break;

    case 'cards':
        echo json_encode(['cards' => blocks($propF)]);
        break;

    case 'rule':
        $card = (string) ($_GET['card'] ?? '');
        $keep = ($_GET['keep'] ?? '') === '1';
        $all = blocks($propF); $hit = null; $rest = [];
        foreach ($all as $b) { if ($hit === null && $b['card'] === $card) { $hit = $b; } else { $rest[] = $b; } }
        if ($hit === null) { echo json_encode(['ok' => false, 'error' => 'that card is not waiting']); break; }
        $amend = trim(str_replace(["\r", "\n"], ' ', (string) ($_GET['amend'] ?? '')));
        if ($keep && $amend !== '' && $amend !== $card) {   // User1's little box: "in fact the card should say ..."
            $ok = preg_match('/^\((comment|genls|isa|has|prop|why|word|mass|unique|opposite|except|default|rule) [^;\r\n]{1,400}\)$/', $amend)
                && substr_count($amend, '"') % 2 === 0 && substr_count($amend, '(') === substr_count($amend, ')');
            if (!$ok) { echo json_encode(['ok' => false, 'error' => 'the amended card is not in a form Nuage reads: one (form ...) on one line, quotes paired, no semicolons']); break; }
            $hit['notes'][] = ';   amended by your ruling, from: ' . $card;
            $hit['card'] = $amend;
        }
        $text = implode("\n", array_merge($hit['notes'], [$hit['card']])) . "\n";
        if ($keep) {
            if (!is_file($taugF)) { $text = "; taught.kb -- cards from patty-cake, kept by your ruling\n" . $text; }
            file_put_contents($taugF, $text, FILE_APPEND);
        } else {
            file_put_contents($dropF, $text, FILE_APPEND);
        }
        $out = '';
        foreach ($rest as $b) { $out .= implode("\n", array_merge($b['notes'], [$b['card']])) . "\n"; }
        file_put_contents($propF, $out);
        echo json_encode(['ok' => true, 'kept' => $keep, 'waiting' => count($rest)]);
        break;

    case 'readback':                                 // what could Mimia have meant? (node words/readback.js): her words, heard back
        $in = json_decode((string) file_get_contents('php://input'), true);
        $t = substr(preg_replace('/[\x00-\x1f]+/', ' ', (string) ($in['text'] ?? '')), 0, 600);
        if ($t === '') { echo json_encode(['ok' => false, 'error' => 'nothing to read back']); break; }
        $tf = tempnam(sys_get_temp_dir(), 'mimia'); file_put_contents($tf, $t); chdir($root);
        $out = []; @exec('"' . $node . '" words\\readback.js --json --file ' . escapeshellarg($tf) . ' 2>&1', $out); @unlink($tf);
        $r = json_decode(implode("\n", $out), true);
        echo json_encode(['ok' => is_array($r), 'read' => $r, 'raw' => is_array($r) ? null : implode("\n", $out)], J);
        break;

    case 'cuts':                                     // the four cuts (pack/cuts.js): 64, 128, 256, 1024 KB, into dist/cuts
        chdir($root);
        $log = (string) @shell_exec('"' . $node . '" pack\\cuts.js 2>&1');
        echo json_encode(['ok' => strpos($log, 'cuts: written') !== false, 'log' => substr($log, 0, 2000)], J);
        break;

    case 'pack':
        chdir($root);
        $log = (string) @shell_exec('"' . $node . '" pack\\pack.js 2>&1');
        $ok = strpos($log, 'read back byte for byte: ok') !== false;
        echo json_encode(['ok' => $ok, 'log' => substr($log, 0, 1200)]);
        break;

    case 'fetch':
        if (llamaExe($llamaDir) !== null) { echo json_encode(['ok' => true, 'note' => 'llama.cpp is already here']); break; }
        chdir($root);
        @file_put_contents($fetchLog, "Starting.\n");
        spawn('powershell -NoProfile -ExecutionPolicy Bypass -File patty\\fetch-llama.ps1', $root, 'start "nuage-fetch" /B powershell -NoProfile -ExecutionPolicy Bypass -File patty\\fetch-llama.ps1 > NUL 2>&1');
        echo json_encode(['ok' => true, 'note' => 'fetching llama.cpp']);
        break;

    case 'lstart':
        $m = (string) ($_GET['model'] ?? '');
        if (!isset($MODELS[$m])) { echo json_encode(['ok' => false, 'error' => 'no such engine: ' . $m]); break; }
        $exe = llamaExe($llamaDir);
        if ($exe === null) { echo json_encode(['ok' => false, 'error' => 'llama.cpp is not here yet: fetch it first']); break; }
        if (llamaProc()) { @exec('taskkill /F /IM llama-server.exe 2>&1'); usleep(500000); }
        @mkdir($libs . DIRECTORY_SEPARATOR . 'models');
        file_put_contents($modelF, $m);
        chdir($root);
        $cmd = 'set "LLAMA_CACHE=' . $libs . DIRECTORY_SEPARATOR . 'models"&& "' . $exe . '" -hf ' . $MODELS[$m]['hf'] . ' --port 8178 -ngl 99 -c 16384 -np 4 --jinja --reasoning-budget 0 --no-mmproj > patty\\llama.log 2>&1';
        spawn('cmd /c "' . $cmd . '"', $root, 'start "nuage-llama" /B cmd /c "' . $cmd . '"');
        echo json_encode(['ok' => true, 'note' => 'starting ' . $MODELS[$m]['name'] . '; the first start fetches the model, several gigabytes, into __libs/models']);
        break;

    case 'lstop':
        if (llamaProc()) { @exec('taskkill /F /IM llama-server.exe 2>&1'); }
        @unlink($modelF);                            // rested: no engine is chosen, and an old failure is no longer told
        echo json_encode(['ok' => true]);
        break;

    case 'ask':                                      // one message, to whichever engine is lit
        $in = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($in) || !is_array($in['messages'] ?? null)) { echo json_encode(['error' => 'send {messages}']); break; }
        $msgs = array_slice(array_map(fn($x) => ['role' => in_array($x['role'] ?? '', ['user', 'system', 'assistant'], true) ? $x['role'] : 'user', 'content' => substr((string) ($x['content'] ?? ''), 0, 6000)], $in['messages']), 0, 8);
        echo json_encode(engineAsk($msgs, max(0.0, min(1.5, (float) ($in['temperature'] ?? 0.6))), max(4, min(200, (int) ($in['max_tokens'] ?? 60))), (int) ($in['seed'] ?? 1)));
        break;

    case 'pupil':                                    // the watched pupil's three moves, its words kept here: a topic, a question, a verdict
        $in = json_decode((string) file_get_contents('php://input'), true);
        $step = (string) ($in['step'] ?? ''); $topic = substr(preg_replace('/[\r\n]+/', ' ', (string) ($in['topic'] ?? '')), 0, 60); $sd = (int) ($in['seed'] ?? 1);
        $told = implode("\n", array_map(fn($x) => 'You: ' . substr((string) ($x['q'] ?? ''), 0, 300) . "\nNuage: " . substr((string) ($x['a'] ?? ''), 0, 600), array_slice(is_array($in['talk'] ?? null) ? $in['talk'] : [], 0, 6)));
        if ($step === 'topic') {
            $SUBJ = ['the night sky', 'animals', 'history', 'geography', 'music', 'cooking', 'machines', 'plants', 'the human body', 'the weather', 'the oceans', 'art', 'sport', 'numbers', 'languages', 'inventions'];   // a different subject each time, so pupils are not all black holes
            echo json_encode(engineAsk([['role' => 'user', 'content' => 'You are a school pupil. Your class has been learning about ' . $SUBJ[abs($sd) % count($SUBJ)] . '. Name one topic within it that you are curious about. Reply with the topic only, in one to four words.']], 0.9, 12, $sd));
        } elseif ($step === 'ask') {
            echo json_encode(engineAsk([['role' => 'user', 'content' => 'You are a school pupil, curious about ' . $topic . ', which you heard about at school. You are talking with Nuage, a small chat program that knows simple facts. Ask short, plain questions, one at a time, to see whether it understands your interest and can satisfy it.' . "\nYour topic: " . $topic . "\n" . ($told !== '' ? "The conversation so far:\n" . $told . "\n" : '') . 'Write your next question to Nuage, one short sentence, nothing else.']], 0.6, 40, $sd));
        } elseif ($step === 'verdict') {
            echo json_encode(engineAsk([['role' => 'user', 'content' => 'You asked Nuage about ' . $topic . ". The conversation:\n" . $told . "\nDid Nuage understand your interest and give a satisfying answer? Reply with one letter, A (satisfied), B (partly), or C (not at all), then a dash, then one short sentence saying what was missing."]], 0.1, 40, $sd));
        } else { echo json_encode(['error' => 'the pupil knows topic, ask, and verdict']); }
        break;

    case 'misses':                                   // a watched pupil's missed questions, for a person to give right answers to
        $in = json_decode((string) file_get_contents('php://input'), true);
        $cf = $root . DIRECTORY_SEPARATOR . 'test' . DIRECTORY_SEPARATOR . 'candidates.txt';
        if (!is_array($in) || !is_array($in['misses'] ?? null)) { echo json_encode(['ok' => false]); break; }
        $topic = preg_replace('/[\r\n;]+/', ' ', substr((string) ($in['topic'] ?? ''), 0, 60));
        $out = is_file($cf) ? '' : "; candidates.txt -- questions Nuage missed in patty-cake's conversations, written by a pupil it did not choose. Give one a right answer\n; (question => pattern) and move it into test/score.txt, and it joins the scoreboard.\n";
        $out .= '; ' . date('Y-m-d\TH-i-s') . " (watched)\n";
        foreach (array_slice($in['misses'], 0, 10) as $x) { $out .= preg_replace('/[\r\n]+/', ' ', substr((string) ($x['q'] ?? ''), 0, 200)) . ' =>   ; ' . $topic . ' | Nuage said: ' . preg_replace('/\s+/', ' ', substr((string) ($x['a'] ?? ''), 0, 120)) . "\n"; }
        file_put_contents($cf, $out, FILE_APPEND);
        echo json_encode(['ok' => true]);
        break;

    default:
        echo json_encode(['error' => 'unknown word: ' . $do . ' (I know status, start, stop, cards, rule, pack, fetch, lstart, lstop, ask, pupil, misses, grind, words, word, cuts, readback)']);
}
