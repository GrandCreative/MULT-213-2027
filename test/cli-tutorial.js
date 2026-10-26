// cli-tutorial.js — learn the command line, safely
//
// Run with:  node cli-tutorial.js      (Node 18 or newer, no npm install needed)
//
// Students pick the terminal they use (Mac Terminal, Windows PowerShell,
// Command Prompt, or Git Bash) and practise real commands for that shell.
// Everything happens in a pretend folder system, so nothing on the real
// computer is created, moved or deleted.

const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");

// ============================================================
// Colours
// ============================================================
const paint = (code) => (s) => `\x1b[${code}m${s}\x1b[0m`;
const c = {
  bold: paint("1"),
  dim: paint("2"),
  red: paint("31"),
  green: paint("32"),
  yellow: paint("33"),
  blue: paint("34;1"),
  magenta: paint("35"),
  cyan: paint("36"),
};
const cmd = (s) => c.cyan(s); // how commands are shown in instructions

// ============================================================
// The four shells
// ============================================================
const SHELLS = [
  {
    key: "mac",
    label: "Mac Terminal",
    tell: "prompt ends with %",
    family: "unix",
    homeRoot: "/Users/student",
  },
  {
    key: "powershell",
    label: "Windows PowerShell",
    tell: 'prompt starts with "PS", like PS C:\\Users\\you>',
    family: "ps",
  },
  {
    key: "cmd",
    label: "Windows Command Prompt",
    tell: "prompt looks like C:\\Users\\you>  (no PS)",
    family: "cmd",
  },
  {
    key: "gitbash",
    label: "Git Bash (on Windows)",
    tell: "says MINGW64 and the prompt ends with $",
    family: "unix",
    homeRoot: "/c/Users/student",
  },
];

// The commands each shell uses for each job (used in instructions and hints)
const TEACH = {
  unix: {
    pwd: "pwd",
    ls: "ls",
    cd: (n) => `cd ${n}`,
    up: "cd ..",
    path: "cd ../projects",
    mkdir: (n) => `mkdir ${n}`,
    mkfile: (n) => `touch ${n}`,
    cp: (a, b) => `cp ${a} ${b}`,
    ren: (a, b) => `mv ${a} ${b}`,
    del: (n) => `rm ${n}`,
    rmdir: (n) => `rm -r ${n}`,
    cat: (n) => `cat ${n}`,
    clear: "clear",
  },
  ps: {
    pwd: "pwd",
    ls: "ls",
    cd: (n) => `cd ${n}`,
    up: "cd ..",
    path: "cd ..\\projects",
    mkdir: (n) => `mkdir ${n}`,
    mkfile: (n) => `ni ${n}`,
    cp: (a, b) => `cp ${a} ${b}`,
    ren: (a, b) => `ren ${a} ${b}`,
    del: (n) => `rm ${n}`,
    rmdir: (n) => `rm ${n} -Recurse`,
    cat: (n) => `cat ${n}`,
    clear: "cls",
  },
  cmd: {
    pwd: "cd",
    ls: "dir",
    cd: (n) => `cd ${n}`,
    up: "cd ..",
    path: "cd ..\\projects",
    mkdir: (n) => `mkdir ${n}`,
    mkfile: (n) => `type nul > ${n}`,
    cp: (a, b) => `copy ${a} ${b}`,
    ren: (a, b) => `ren ${a} ${b}`,
    del: (n) => `del ${n}`,
    rmdir: (n) => `rd /s /q ${n}`,
    cat: (n) => `type ${n}`,
    clear: "cls",
  },
};

// Every name a command can be typed as, mapped to what it does
const ALIASES = {
  unix: {
    pwd: "pwd", ls: "ls", cd: "cd", mkdir: "mkdir", touch: "touch", cp: "cp",
    mv: "mv", rm: "rm", rmdir: "rmdir", cat: "cat", echo: "echo", clear: "clear",
  },
  ps: {
    pwd: "pwd", "get-location": "pwd", gl: "pwd",
    ls: "ls", dir: "ls", gci: "ls", "get-childitem": "ls",
    cd: "cd", chdir: "cd", sl: "cd", "set-location": "cd",
    mkdir: "mkdir", md: "mkdir",
    ni: "newitem", "new-item": "newitem",
    cp: "cp", copy: "cp", cpi: "cp", "copy-item": "cp",
    mv: "mv", move: "mv", mi: "mv", "move-item": "mv",
    ren: "ren", rni: "ren", "rename-item": "ren",
    rm: "rm", del: "rm", erase: "rm", ri: "rm", rd: "rm", rmdir: "rm", "remove-item": "rm",
    cat: "cat", type: "cat", gc: "cat", "get-content": "cat",
    echo: "echo", "write-output": "echo",
    cls: "clear", clear: "clear",
  },
  cmd: {
    cd: "cd", chdir: "cd", dir: "ls", md: "mkdir", mkdir: "mkdir",
    copy: "cp", move: "mv", ren: "ren", rename: "ren",
    del: "del", erase: "del", rd: "rd", rmdir: "rd",
    type: "cat", echo: "echo", cls: "clear",
  },
};

// Commands from *other* shells, so we can say "in your terminal, use X instead"
const FOREIGN = {
  unix: { dir: "ls", cls: "clear", copy: "cp", move: "mv", del: "rm", md: "mkdir", type: "cat", ni: "touch", ren: "mv", rd: "rm -r" },
  ps: { touch: "ni", pwd: "pwd" },
  cmd: { ls: "dir", pwd: "cd", clear: "cls", cp: "copy", mv: "move", rm: "del", cat: "type", touch: "type nul > filename", ni: "type nul > filename" },
};

const REAL_BUT_NOT_HERE = ["node", "npm", "npx", "git", "code", "python", "python3", "sudo", "open", "start", "explorer", "nano", "vim", "notepad"];

// ============================================================
// The pretend file system
// ============================================================
const dir = (children = {}) => ({ type: "dir", children });
const file = (content = "") => ({ type: "file", content });

function freshFileSystem() {
  return dir({
    Desktop: dir(),
    Documents: dir({
      "essay.docx": file("(this is a Word document)"),
      "notes.txt": file("Remember to practise the command line!"),
    }),
    Downloads: dir({ "photo.jpg": file("(this is a picture)") }),
    projects: dir({
      "todo.txt": file("1. Learn the command line\n2. Build a website\n3. Play tic-tac-toe"),
      "old-stuff": dir({
        "draft1.txt": file("an old draft"),
        "draft2.txt": file("another old draft"),
      }),
    }),
  });
}

// Find a child by name, ignoring upper/lower case (like Windows and macOS do)
function findKey(node, name) {
  const lower = name.toLowerCase();
  return Object.keys(node.children).find((k) => k.toLowerCase() === lower);
}

// Walk a list of folder names; returns { node, real } or null
function getNode(st, segs) {
  let node = st.fs;
  const real = [];
  for (const s of segs) {
    if (node.type !== "dir") return null;
    const k = findKey(node, s);
    if (!k) return null;
    node = node.children[k];
    real.push(k);
  }
  return { node, real };
}

function displayPath(sh, segs) {
  if (sh.family === "unix") return sh.homeRoot + segs.map((s) => "/" + s).join("");
  return "C:\\Users\\student" + segs.map((s) => "\\" + s).join("");
}

function isAbsolute(sh, p) {
  if (sh.family === "unix") return p.startsWith("/");
  return /^[a-zA-Z]:/.test(p) || p.startsWith("\\") || p.startsWith("/");
}

// Turn what the student typed ("../projects", "~", "C:\Users\student") into folder names
function resolvePath(st, sh, p) {
  let segs = [...st.cwd];
  let rest = p;
  const homeForms = sh.family === "unix" ? [sh.homeRoot] : ["C:\\Users\\student", "C:/Users/student"];
  const home = homeForms.find((h) => rest.toLowerCase().startsWith(h.toLowerCase()));

  if (sh.family !== "cmd" && (rest === "~" || rest.startsWith("~/") || rest.startsWith("~\\"))) {
    segs = [];
    rest = rest.slice(1);
  } else if (home) {
    segs = [];
    rest = rest.slice(home.length);
  } else if (isAbsolute(sh, rest)) {
    return { error: "outside" };
  }

  const parts = rest.split(sh.family === "unix" ? /\// : /[\\/]/).filter(Boolean);
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      if (segs.length === 0) return { error: "outside" };
      segs.pop();
      continue;
    }
    segs.push(part);
  }
  return { segs };
}

// ============================================================
// Output that looks like each shell
// ============================================================
function formatListing(sh, segs, node, onlyNames) {
  const names = onlyNames || Object.keys(node.children);
  const sorted = [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const isDir = (n) => node.children[n].type === "dir";

  if (sh.family === "unix") {
    if (sorted.length === 0) return [];
    return [sorted.map((n) => (isDir(n) ? c.blue(n + "/") : n)).join("   ")];
  }

  if (sh.family === "ps") {
    if (sorted.length === 0) return [];
    const dirsFirst = [...sorted.filter(isDir), ...sorted.filter((n) => !isDir(n))];
    const lines = ["", `    Directory: ${displayPath(sh, segs)}`, "", "Mode       Length  Name", "----       ------  ----"];
    for (const n of dirsFirst) {
      if (isDir(n)) lines.push(`d----               ${c.blue(n)}`);
      else lines.push(`-a---  ${String(node.children[n].content.length).padStart(10)}  ${n}`);
    }
    lines.push("");
    return lines;
  }

  // Command Prompt
  const lines = ["", ` Directory of ${displayPath(sh, segs)}`, ""];
  let files = 0, dirs = 0;
  for (const n of sorted) {
    if (isDir(n)) { dirs++; lines.push(`    <DIR>          ${c.blue(n)}`); }
    else { files++; lines.push(`    ${String(node.children[n].content.length).padStart(14)} ${n}`); }
  }
  lines.push(`               ${files} File(s)`, `               ${dirs} Dir(s)`, "");
  return lines;
}

function notFound(sh, name, arg, st, kind = "path") {
  if (sh.key === "mac") return name === "cd" ? `cd: no such file or directory: ${arg}` : `${name}: ${arg}: No such file or directory`;
  if (sh.key === "gitbash") return `bash: ${name}: ${arg}: No such file or directory`;
  if (sh.family === "ps") return `${name}: Cannot find path '${displayPath(sh, st.cwd)}\\${arg}' because it does not exist.`;
  return kind === "file" ? "The system cannot find the file specified." : "The system cannot find the path specified.";
}

function unknownCommand(sh, name) {
  if (sh.key === "mac") return `zsh: command not found: ${name}`;
  if (sh.key === "gitbash") return `bash: ${name}: command not found`;
  if (sh.family === "ps") return `${name}: The term '${name}' is not recognized as a name of a cmdlet, function, script file, or executable program.`;
  return `'${name}' is not recognized as an internal or external command,\noperable program or batch file.`;
}

// ============================================================
// Reading what the student typed
// ============================================================
function tokenize(line, family) {
  const tokens = [];
  let cur = "", has = false, quote = null;
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || (ch === "'" && family !== "cmd")) { quote = ch; has = true; continue; }
    if (/\s/.test(ch) || (family === "ps" && ch === ",")) {
      if (has) tokens.push(cur);
      cur = ""; has = false;
      continue;
    }
    if (ch === ">") {
      if (has) tokens.push(cur);
      tokens.push(">");
      cur = ""; has = false;
      continue;
    }
    cur += ch; has = true;
  }
  if (quote) return { error: "You opened a quote mark but didn't close it." };
  if (has) tokens.push(cur);
  return { tokens };
}

// Split arguments into plain words and options (-r, -Recurse, /s ...)
function parseArgs(family, args) {
  const words = [], flags = new Set(), params = {};
  const valued = ["itemtype", "name", "path", "newname", "destination", "value"];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (family === "unix" && a.startsWith("-") && a.length > 1) {
      for (const ch of a.slice(1)) flags.add(ch.toLowerCase());
    } else if (family === "ps" && a.startsWith("-") && a.length > 1) {
      const key = a.slice(1).toLowerCase();
      if (valued.includes(key) && i + 1 < args.length) params[key] = args[++i];
      else flags.add(key);
    } else if (family === "cmd" && a.startsWith("/") && a.length > 1) {
      flags.add(a.slice(1).toLowerCase());
    } else {
      words.push(a);
    }
  }
  return { words, flags, params };
}

// ============================================================
// Running a command in the pretend terminal
// Returns { lines, error, tip, act }
// ============================================================
function run(st, sh, rawLine) {
  let line = rawLine.trim();
  if (sh.family !== "unix") line = line.replace(/^(cd|chdir)(\.\.|\\)/i, "$1 $2"); // "cd.." works on Windows

  const t = tokenize(line, sh.family);
  if (t.error) return { lines: [], error: true, tip: t.error };
  let tokens = t.tokens;
  if (tokens.length === 0) return { lines: [], act: { type: "none" } };

  // Handle  echo hello > file.txt   and   type nul > file.txt
  const gt = tokens.indexOf(">");
  if (gt !== -1) {
    const left = tokens.slice(0, gt);
    const target = tokens[gt + 1];
    if (!target) return { lines: [], error: true, tip: "After > you need the name of the file to write to." };
    const leftName = (left[0] || "").toLowerCase();
    let content;
    if (ALIASES[sh.family][leftName] === "echo") content = left.slice(1).join(" ");
    else if (sh.family === "cmd" && leftName === "type" && (left[1] || "").toLowerCase() === "nul") content = "";
    else return { lines: [], error: true, tip: "In this practice, > only works with echo, e.g. " + cmd("echo hello > notes.txt") };
    return makeFile(st, sh, target, { overwrite: true, content, name: leftName });
  }

  const typed = tokens[0];
  const name = sh.family === "unix" ? typed : typed.toLowerCase();
  const what = ALIASES[sh.family][name];
  const { words, flags, params } = parseArgs(sh.family, tokens.slice(1));

  if (!what) {
    const lower = typed.toLowerCase();
    let tip;
    if (sh.family === "unix" && ALIASES.unix[lower]) tip = `Commands are lowercase here. Try ${cmd(lower)}.`;
    else if (FOREIGN[sh.family][lower]) tip = `That command is from a different terminal. In ${sh.label}, use ${cmd(FOREIGN[sh.family][lower])}.`;
    else if (REAL_BUT_NOT_HERE.includes(lower)) tip = `${lower} is a real command, but this practice only covers files and folders. Try it in your real terminal after!`;
    else tip = "Check the spelling, or type hint.";
    return { lines: [unknownCommand(sh, typed)], error: true, tip };
  }

  switch (what) {
    case "pwd": {
      const p = displayPath(sh, st.cwd);
      if (sh.family === "ps") return { lines: ["", "Path", "----", p, ""], act: { type: "pwd" } };
      return { lines: [p], act: { type: "pwd" } };
    }

    case "ls": {
      const target = words[0] || ".";
      const r = resolvePath(st, sh, target);
      if (r.error) return outside();
      const n = getNode(st, r.segs);
      if (!n) return { lines: [notFound(sh, typed, target, st, "file")], error: true, tip: `There's nothing called "${target}" here.` };
      if (n.node.type === "file") return { lines: [n.real[n.real.length - 1]], act: { type: "ls", path: n.real.slice(0, -1) } };
      const lines = formatListing(sh, n.real, n.node);
      if (lines.length === 0 && sh.family !== "cmd") lines.push(c.dim("(nothing printed — this folder is empty)"));
      return { lines, act: { type: "ls", path: n.real } };
    }

    case "cd": {
      if (words.length === 0) {
        if (sh.family === "cmd") return { lines: [displayPath(sh, st.cwd)], act: { type: "pwd" } };
        const from = st.cwd;
        st.cwd = [];
        return { lines: [], act: { type: "cd", from, to: [] } };
      }
      const target = words.join(sh.family === "cmd" ? " " : " ");
      const r = resolvePath(st, sh, target);
      if (r.error) return outside();
      const n = getNode(st, r.segs);
      if (!n) return { lines: [notFound(sh, typed, target, st)], error: true, tip: `There's no folder called "${target}" here. Use ${cmd(TEACH[sh.family].ls)} to see what's here.` };
      if (n.node.type === "file") {
        const msg = sh.family === "unix" ? `cd: not a directory: ${target}` : sh.family === "ps" ? `cd: Cannot find path '${target}' because it is a file.` : "The directory name is invalid.";
        return { lines: [msg], error: true, tip: `"${target}" is a file. You can only cd into folders.` };
      }
      const from = st.cwd;
      st.cwd = n.real;
      return { lines: [], act: { type: "cd", from, to: n.real } };
    }

    case "mkdir": {
      if (words.length === 0) return usage(sh, "mkdir", "Give the folder a name, like " + cmd(TEACH[sh.family].mkdir("my-folder")));
      const lines = [];
      for (const w of words) {
        const res = makeDir(st, sh, w, sh.family !== "unix" || flags.has("p"));
        if (res.error) return { lines: [...lines, ...res.lines], error: true, tip: res.tip };
        lines.push(...res.lines);
      }
      return { lines, act: { type: "mkdir" } };
    }

    case "touch": {
      if (words.length === 0) return usage(sh, "touch", "Give the file a name, like " + cmd("touch notes.txt"));
      for (const w of words) {
        const res = makeFile(st, sh, w, { overwrite: false, existsOk: true, content: "", name: "touch" });
        if (res.error) return res;
      }
      return { lines: [], act: { type: "mkfile" } };
    }

    case "newitem": {
      let target = params.path || words[0];
      if (params.name) target = (target ? target + "\\" : "") + params.name;
      if (!target) return usage(sh, "New-Item", "Give it a name, like " + cmd("ni notes.txt"));
      const type = (params.itemtype || "file").toLowerCase();
      if (type.startsWith("d")) {
        const res = makeDir(st, sh, target, true);
        return res.error ? res : { lines: res.lines, act: { type: "mkdir" } };
      }
      return makeFile(st, sh, target, { overwrite: flags.has("force"), content: params.value || "", name: "New-Item", psListing: true });
    }

    case "cp":
      return copyOrMove(st, sh, typed, words, flags, "copy");

    case "mv":
      return copyOrMove(st, sh, typed, words, flags, "move");

    case "ren": {
      if (words.length < 2) return usage(sh, typed, "Use it like " + cmd(TEACH[sh.family].ren("old.txt", "new.txt")));
      const [src, newName] = words;
      if (/[\\/]/.test(newName)) {
        return { lines: [sh.family === "cmd" ? "The syntax of the command is incorrect." : "Rename-Item: Cannot rename to a path. Give just the new name."], error: true, tip: "The second name should be just a name, not a path." };
      }
      const r = resolvePath(st, sh, src);
      if (r.error) return outside();
      const n = getNode(st, r.segs);
      if (!n) return { lines: [notFound(sh, typed, src, st, "file")], error: true, tip: `There's nothing called "${src}" here.` };
      const parent = getNode(st, n.real.slice(0, -1)).node;
      const oldKey = n.real[n.real.length - 1];
      const clash = findKey(parent, newName);
      if (clash && clash !== oldKey) {
        return { lines: [sh.family === "cmd" ? "A duplicate file name exists, or the file cannot be found." : `Rename-Item: Cannot create a file when that file already exists.`], error: true, tip: `There's already something called "${newName}".` };
      }
      delete parent.children[oldKey];
      parent.children[newName] = n.node;
      return { lines: [], act: { type: "rename" } };
    }

    case "rm":
      return removeThings(st, sh, typed, words, flags, sh.family === "ps" ? "ps" : "rm");

    case "rmdir":
      return removeThings(st, sh, typed, words, flags, "rmdir");

    case "del":
      return removeThings(st, sh, typed, words, flags, "del");

    case "rd":
      return removeThings(st, sh, typed, words, flags, "rd");

    case "cat": {
      if (words.length === 0) return usage(sh, typed, "Give it a file name, like " + cmd(TEACH[sh.family].cat("todo.txt")));
      const r = resolvePath(st, sh, words[0]);
      if (r.error) return outside();
      const n = getNode(st, r.segs);
      if (!n) return { lines: [notFound(sh, typed, words[0], st, "file")], error: true, tip: `There's no file called "${words[0]}" here.` };
      if (n.node.type === "dir") return { lines: [sh.family === "cmd" ? "Access is denied." : `${typed}: ${words[0]}: Is a directory`], error: true, tip: "That's a folder. This command shows what's inside a file." };
      return { lines: n.node.content ? n.node.content.split("\n") : [], act: { type: "cat" } };
    }

    case "echo":
      return { lines: [words.join(" ")], act: { type: "echo" } };

    case "clear":
      return { lines: [], act: { type: "clear" }, clear: true };
  }
  return { lines: [], act: { type: "none" } };

  // --- little helpers used above ---
  function outside() {
    return { lines: [], error: true, tip: "This practice area stops at your home folder, so you can't go above it here." };
  }
}

function usage(sh, name, tip) {
  const msg = sh.family === "cmd" ? "The syntax of the command is incorrect." : `${name}: missing operand`;
  return { lines: [msg], error: true, tip };
}

function makeDir(st, sh, target, makeParents) {
  const r = resolvePath(st, sh, target);
  if (r.error || r.segs.length === 0) return { error: true, lines: [], tip: "That isn't a place you can make a folder." };
  let node = st.fs;
  const real = [];
  for (let i = 0; i < r.segs.length; i++) {
    const seg = r.segs[i];
    const last = i === r.segs.length - 1;
    const k = findKey(node, seg);
    if (k) {
      if (last) {
        const msg = sh.family === "unix" ? `mkdir: ${target}: File exists`
          : sh.family === "ps" ? `New-Item: An item with the specified name ${displayPath(sh, [...real, k])} already exists.`
          : `A subdirectory or file ${target} already exists.`;
        return { error: true, lines: [msg], tip: `There's already something called "${k}" here.` };
      }
      if (node.children[k].type !== "dir") return { error: true, lines: [`mkdir: ${target}: Not a directory`], tip: `"${k}" is a file, not a folder.` };
      node = node.children[k];
      real.push(k);
    } else {
      if (!last && !makeParents) return { error: true, lines: [`mkdir: ${target}: No such file or directory`], tip: `The folder "${seg}" doesn't exist yet. Make it first (or use ${cmd("mkdir -p")}).` };
      node.children[seg] = dir();
      node = node.children[seg];
      real.push(seg);
    }
  }
  // PowerShell prints a little table when it makes something
  const lines = sh.family === "ps" ? formatListing(sh, real.slice(0, -1), getNode(st, real.slice(0, -1)).node, [real[real.length - 1]]) : [];
  return { lines };
}

function makeFile(st, sh, target, opts) {
  const r = resolvePath(st, sh, target);
  if (r.error || r.segs.length === 0) return { lines: [], error: true, tip: "That isn't a place you can make a file." };
  const parentSegs = r.segs.slice(0, -1);
  const name = r.segs[r.segs.length - 1];
  const p = getNode(st, parentSegs);
  if (!p || p.node.type !== "dir") return { lines: [notFound(sh, opts.name, target, st)], error: true, tip: "The folder you're trying to put this file in doesn't exist." };
  const existing = findKey(p.node, name);
  if (existing) {
    const node = p.node.children[existing];
    if (node.type === "dir") return { lines: [`${opts.name}: ${target}: Is a directory`], error: true, tip: `"${existing}" is a folder, not a file.` };
    if (opts.existsOk) return { lines: [], act: { type: "mkfile" } };
    if (!opts.overwrite) return { lines: [`New-Item: The file '${displayPath(sh, [...p.real, existing])}' already exists.`], error: true, tip: `There's already a file called "${existing}".` };
    node.content = opts.content;
    return { lines: [], act: { type: "mkfile" } };
  }
  p.node.children[name] = file(opts.content);
  const lines = opts.psListing ? formatListing(sh, p.real, p.node, [name]) : [];
  return { lines, act: { type: "mkfile" } };
}

function copyOrMove(st, sh, typed, words, flags, mode) {
  const T = TEACH[sh.family];
  if (words.length < 2) {
    return usage(sh, typed, `You need two names: what to ${mode}, and where it goes. Like ${cmd(mode === "copy" ? T.cp("a.txt", "b.txt") : sh.family === "unix" ? "mv a.txt folder" : (sh.family === "ps" ? "mv" : "move") + " a.txt folder")}`);
  }
  const [src, dest] = words;
  const r = resolvePath(st, sh, src);
  if (r.error) return { lines: [], error: true, tip: "This practice area stops at your home folder." };
  const s = getNode(st, r.segs);
  if (!s) return { lines: [notFound(sh, typed, src, st, "file")], error: true, tip: `There's nothing called "${src}" here. Check the spelling with ${cmd(T.ls)}.` };
  if (mode === "copy" && s.node.type === "dir") return { lines: [], error: true, tip: "In this practice, copying works on files only." };

  const d = resolvePath(st, sh, dest);
  if (d.error) return { lines: [], error: true, tip: "This practice area stops at your home folder." };
  let destParent, destName;
  const dn = getNode(st, d.segs);
  if (dn && dn.node.type === "dir") {
    destParent = dn;
    destName = s.real[s.real.length - 1];
  } else {
    destParent = getNode(st, d.segs.slice(0, -1));
    destName = dn ? dn.real[dn.real.length - 1] : d.segs[d.segs.length - 1];
    if (!destParent || destParent.node.type !== "dir") return { lines: [notFound(sh, typed, dest, st)], error: true, tip: "The place you're sending it to doesn't exist." };
  }

  // Don't move a folder inside itself
  const destPathLower = [...destParent.real, destName].join("/").toLowerCase();
  const srcPathLower = s.real.join("/").toLowerCase();
  if (destPathLower === srcPathLower) return { lines: [], error: true, tip: "That's the same place it already is." };
  if (mode === "move" && s.node.type === "dir" && destPathLower.startsWith(srcPathLower + "/")) return { lines: [], error: true, tip: "You can't move a folder inside itself." };
  if (mode === "move" && st.cwd.join("/").toLowerCase().startsWith(srcPathLower) && s.node.type === "dir") return { lines: [], error: true, tip: "You're standing inside that folder. Move out of it first with " + cmd(T.up) + "." };

  const clash = findKey(destParent.node, destName);
  if (clash) {
    if (destParent.node.children[clash].type === "dir") return { lines: [], error: true, tip: `There's already a folder called "${clash}" there.` };
    if (sh.family === "ps" && mode === "move") return { lines: [`Move-Item: Cannot create a file when that file already exists.`], error: true, tip: `There's already a file called "${clash}" there.` };
    delete destParent.node.children[clash];
  }

  const srcParent = getNode(st, s.real.slice(0, -1)).node;
  if (mode === "copy") destParent.node.children[destName] = file(s.node.content);
  else {
    delete srcParent.children[s.real[s.real.length - 1]];
    destParent.node.children[destName] = s.node;
  }

  const lines = [];
  if (sh.family === "cmd") lines.push(mode === "copy" ? "        1 file(s) copied." : `        1 ${s.node.type === "dir" ? "dir(s)" : "file(s)"} moved.`);
  return { lines, act: { type: mode } };
}

function removeThings(st, sh, typed, words, flags, style) {
  const T = TEACH[sh.family];
  if (words.length === 0) return usage(sh, typed, "Say what to delete, like " + cmd(T.del("old.txt")));
  for (const w of words) {
    const r = resolvePath(st, sh, w);
    if (r.error || r.segs.length === 0) return { lines: [], error: true, tip: "You can't delete that here." };
    const n = getNode(st, r.segs);
    if (!n) return { lines: [notFound(sh, typed, w, st, "file")], error: true, tip: `There's nothing called "${w}" here.` };
    const isDir = n.node.type === "dir";
    const empty = isDir && Object.keys(n.node.children).length === 0;
    const pathLower = n.real.join("/").toLowerCase();

    if (isDir && (st.cwd.join("/").toLowerCase() + "/").startsWith(pathLower + "/")) {
      return { lines: [sh.family === "cmd" ? "The process cannot access the file because it is being used by another process." : `${typed}: ${w}: You're inside this folder`], error: true, tip: `You're standing inside that folder. Move out of it first (${cmd(T.up)}).` };
    }

    if (style === "rm" && isDir && !flags.has("r")) {
      return { lines: [`rm: ${w}: is a directory`], error: true, tip: `To delete a folder and everything in it, add -r: ${cmd(T.rmdir(w))}` };
    }
    if (style === "rmdir" && !isDir) return { lines: [`rmdir: ${w}: Not a directory`], error: true, tip: `To delete a file, use ${cmd(T.del(w))}` };
    if (style === "rmdir" && !empty) return { lines: [`rmdir: ${w}: Directory not empty`], error: true, tip: `rmdir only deletes empty folders. To delete a folder and everything in it: ${cmd(T.rmdir(w))}` };
    if (style === "ps" && isDir && !empty && !flags.has("recurse")) {
      return {
        lines: [`Confirm`, `The item at ${displayPath(sh, n.real)} has children and the Recurse parameter was not specified.`],
        error: true,
        tip: `PowerShell wants to be sure. Add -Recurse to delete the folder and everything in it: ${cmd(T.rmdir(w))}`,
      };
    }
    if (style === "del" && isDir) return { lines: [], error: true, tip: `del is for files. To delete a folder, use ${cmd(T.rmdir(w))}` };
    if (style === "rd" && !isDir) return { lines: ["The directory name is invalid."], error: true, tip: `rd is for folders. To delete a file, use ${cmd(T.del(w))}` };
    if (style === "rd" && !empty && !flags.has("s")) return { lines: ["The directory is not empty."], error: true, tip: `Add /s to delete everything inside too (and /q so it doesn't ask): ${cmd(T.rmdir(w))}` };

    const extra = style === "rd" && flags.has("s") && !flags.has("q") ? [`${w}, Are you sure (Y/N)? Y   ${c.dim("(answered Y for you in this practice)")}`] : [];
    delete getNode(st, n.real.slice(0, -1)).node.children[n.real[n.real.length - 1]];
    if (extra.length) return { lines: extra, act: { type: "delete" } };
  }
  return { lines: [], act: { type: "delete" } };
}

// Draw a folder as a tree (used at the end)
function tree(node, prefix = "") {
  const names = Object.keys(node.children).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const lines = [];
  names.forEach((n, i) => {
    const last = i === names.length - 1;
    const child = node.children[n];
    lines.push(prefix + (last ? "└── " : "├── ") + (child.type === "dir" ? c.blue(n + "/") : n));
    if (child.type === "dir") lines.push(...tree(child, prefix + (last ? "    " : "│   ")));
  });
  return lines;
}

// ============================================================
// Helpers the lessons use to check progress
// ============================================================
const at = (st, path) => st.cwd.join("/").toLowerCase() === path.toLowerCase();
function has(st, path, type) {
  const n = getNode(st, path.split("/"));
  return !!n && (!type || n.node.type === type);
}
function force(st, path, type) {
  const segs = path.split("/");
  let node = st.fs;
  segs.forEach((s, i) => {
    const k = findKey(node, s);
    if (k) node = node.children[k];
    else {
      node.children[s] = i === segs.length - 1 && type === "file" ? file() : dir();
      node = node.children[s];
    }
  });
}
function forceRemove(st, path) {
  const segs = path.split("/");
  const parent = getNode(st, segs.slice(0, -1));
  const k = parent && findKey(parent.node, segs[segs.length - 1]);
  if (k) delete parent.node.children[k];
}
const goTo = (st, path) => { st.cwd = path ? path.split("/") : []; };

// ============================================================
// The lessons
// ============================================================
const STEPS = [
  {
    title: "Where am I?",
    teach: (T, sh) => [
      "The terminal is always \"standing\" in one folder. Commands act on that folder.",
      "When you open a terminal, you start in your home folder.",
      "",
      `Type ${cmd(T.pwd)} and press Enter to see where you are.`,
      sh.family === "cmd" ? c.dim("(In Command Prompt, cd on its own shows your location.)") : c.dim("(pwd stands for \"print working directory\".)"),
    ],
    done: (st, act) => act.type === "pwd",
    hint: (T) => T.pwd,
    win: "That's a path: every folder from the top of the drive down to where you are.",
  },
  {
    title: "What's in here?",
    teach: (T, sh) => [
      `Type ${cmd(T.ls)} to list everything in this folder.`,
      sh.family === "ps" ? c.dim("(dir works too. They do the same thing in PowerShell.)") : null,
    ],
    done: (st, act) => act.type === "ls",
    hint: (T) => T.ls,
    win: (T, sh) =>
      sh.family === "unix" ? "Folders are shown in blue with a / at the end. Everything else is a file."
        : sh.family === "ps" ? "Folders have a d in the Mode column. Files have a size (Length)."
        : "Folders are marked <DIR>. Files show their size instead.",
  },
  {
    title: "Go into a folder",
    teach: (T) => [
      `cd means "change directory" (directory is another word for folder).`,
      `Go into the projects folder: ${cmd(T.cd("projects"))}`,
      c.dim("Watch your prompt change. It shows which folder you're in."),
    ],
    done: (st) => at(st, "projects"),
    hint: (T) => T.cd("projects"),
    skip: (st) => goTo(st, "projects"),
  },
  {
    title: "Look around",
    teach: (T) => [`You're in projects now. List what's in here with ${cmd(T.ls)}.`],
    done: (st, act) => act.type === "ls" && at(st, "projects"),
    hint: (T) => T.ls,
    win: (T) => `Tip: you can read a text file without opening it. Try ${cmd(T.cat("todo.txt"))} any time.`,
  },
  {
    title: "Go back up",
    teach: (T) => [
      'Two dots (..) mean "the folder above this one".',
      `Go back up to your home folder: ${cmd(T.up)}`,
    ],
    done: (st) => at(st, ""),
    hint: (T) => T.up,
    skip: (st) => goTo(st, ""),
  },
  {
    title: "Let Tab do the typing",
    teach: (T) => [
      "Typing long names is slow and easy to get wrong. The Tab key finishes names for you.",
      `Type ${cmd("cd Doc")} and then press ${c.bold("Tab")}. It should fill in Documents. Then press Enter.`,
      "",
      c.dim(`Another shortcut: the ↑ Up arrow brings back commands you've typed before.`),
    ],
    done: (st) => at(st, "Documents"),
    hint: (T) => T.cd("Doc") + "  then press Tab, then Enter",
    skip: (st) => goTo(st, "Documents"),
  },
  {
    title: "Jump with a path",
    teach: (T, sh) => [
      "You're in Documents. You could go up, then into projects, as two commands.",
      "Or you can do it in one, by joining the steps with a slash:",
      `${cmd(T.path)}`,
      sh.family !== "unix" ? c.dim("(Windows uses \\ backslashes. PowerShell also accepts /.)") : null,
    ],
    done: (st) => at(st, "projects"),
    hint: (T) => T.path,
    skip: (st) => goTo(st, "projects"),
    win: 'Paths read left to right: ".." goes up one folder, then "projects" goes down into it.',
  },
  {
    title: "Make a folder",
    teach: (T) => [
      `Let's start a website. Make a new folder called my-site: ${cmd(T.mkdir("my-site"))}`,
      c.dim("Tip: avoid spaces in names. Use dashes instead (my-site, not my site)."),
    ],
    done: (st) => has(st, "projects/my-site", "dir"),
    hint: (T) => T.mkdir("my-site"),
    skip: (st) => { force(st, "projects/my-site"); goTo(st, "projects"); },
    win: (T) => `Check it's there with ${cmd(T.ls)} if you like.`,
  },
  {
    title: "Go into your new folder",
    teach: (T) => [`Move into my-site: ${cmd(T.cd("my-site"))}`],
    done: (st) => at(st, "projects/my-site"),
    hint: (T) => T.cd("my-site"),
    skip: (st) => { force(st, "projects/my-site"); goTo(st, "projects/my-site"); },
  },
  {
    title: "Make a file",
    teach: (T, sh) => [
      `Every website needs an index.html. Make one: ${cmd(T.mkfile("index.html"))}`,
      sh.family === "unix" ? c.dim("(touch makes a new, empty file.)")
        : sh.family === "ps" ? c.dim("(ni is short for New-Item.)")
        : c.dim('(This means "type nothing into a new file called index.html". Odd, but it works!)'),
    ],
    done: (st) => has(st, "projects/my-site/index.html", "file"),
    hint: (T) => T.mkfile("index.html"),
    skip: (st) => { force(st, "projects/my-site/index.html", "file"); goTo(st, "projects/my-site"); },
  },
  {
    title: "Copy a file",
    teach: (T) => [
      "Copying needs two names: the file you have, then the name for the copy.",
      `Copy index.html to a new file called about.html: ${cmd(T.cp("index.html", "about.html"))}`,
    ],
    done: (st) => has(st, "projects/my-site/about.html", "file"),
    hint: (T) => T.cp("index.html", "about.html"),
    skip: (st) => { force(st, "projects/my-site/about.html", "file"); goTo(st, "projects/my-site"); },
    win: (T) => `Run ${cmd(T.ls)} and you'll see both files.`,
  },
  {
    title: "Rename a file",
    teach: (T, sh) => [
      "Oops, that page should be called contact.html.",
      sh.family === "unix"
        ? `There's no rename command here. Instead you mv (move) the file to a new name: ${cmd(T.ren("about.html", "contact.html"))}`
        : `Rename it: ${cmd(T.ren("about.html", "contact.html"))}`,
    ],
    done: (st) => has(st, "projects/my-site/contact.html", "file") && !has(st, "projects/my-site/about.html"),
    hint: (T) => T.ren("about.html", "contact.html"),
    skip: (st) => { forceRemove(st, "projects/my-site/about.html"); force(st, "projects/my-site/contact.html", "file"); goTo(st, "projects/my-site"); },
  },
  {
    title: "Delete a file",
    teach: (T, sh) => [
      `Changed your mind. Delete contact.html: ${cmd(T.del("contact.html"))}`,
      c.yellow(`⚠ Careful: deleting in the terminal skips the ${sh.key === "mac" ? "Trash" : "Recycle Bin"}. It's gone for good.`),
    ],
    done: (st) => !has(st, "projects/my-site/contact.html") && has(st, "projects/my-site/index.html"),
    hint: (T) => T.del("contact.html"),
    skip: (st) => { forceRemove(st, "projects/my-site/contact.html"); force(st, "projects/my-site/index.html", "file"); goTo(st, "projects/my-site"); },
  },
  {
    title: "Delete a folder",
    teach: (T, sh) => [
      "Back in projects there's a folder called old-stuff you don't need any more.",
      `1. Go up a level: ${cmd(T.up)}`,
      `2. Delete the folder and everything in it: ${cmd(T.rmdir("old-stuff"))}`,
      sh.family === "unix" ? c.dim("(-r means \"recursive\": the folder and everything inside it.)")
        : sh.family === "ps" ? c.dim("(-Recurse means the folder and everything inside it.)")
        : c.dim("(/s means everything inside it, /q means don't ask \"are you sure?\")"),
    ],
    done: (st) => !has(st, "projects/old-stuff"),
    hint: (T) => `${T.up}   then   ${T.rmdir("old-stuff")}`,
    skip: (st) => { forceRemove(st, "projects/old-stuff"); goTo(st, "projects"); },
  },
  {
    title: "Final challenge",
    teach: () => [
      "Put it all together, with no step-by-step this time.",
      "You're in projects right now. Go back into my-site and set it up like this:",
      "",
      `  my-site/`,
      `  ├── ${c.blue("css/")}`,
      `  │   └── style.css`,
      `  ├── ${c.blue("images/")}`,
      `  └── index.html  ${c.dim("(you already made this)")}`,
      "",
      c.dim("Type hint if you get stuck."),
    ],
    done: (st) => has(st, "projects/my-site/css", "dir") && has(st, "projects/my-site/css/style.css", "file") && has(st, "projects/my-site/images", "dir"),
    hint: (T) => [
      `Get into my-site first (${T.cd("my-site")} from projects), then:`,
      `${T.mkdir("css")}`,
      `${T.mkdir("images")}`,
      `${T.cd("css")}`,
      `${T.mkfile("style.css")}`,
    ].join("\n    "),
    skip: (st) => { force(st, "projects/my-site/css/style.css", "file"); force(st, "projects/my-site/images"); },
  },
];

// ============================================================
// Cheat sheet
// ============================================================
function cheatSheet(T, sh) {
  const rows = [
    ["Where am I?", T.pwd],
    ["List what's here", T.ls],
    ["Go into a folder", T.cd("name")],
    ["Go up one folder", T.up],
    ["Make a folder", T.mkdir("name")],
    ["Make a file", T.mkfile("name.txt")],
    ["Show what's in a file", T.cat("name.txt")],
    ["Copy a file", T.cp("old.txt", "new.txt")],
    ["Rename a file", T.ren("old.txt", "new.txt")],
    ["Delete a file", T.del("name.txt")],
    ["Delete a folder", T.rmdir("name")],
    ["Clear the screen", T.clear],
    ["Finish a name", "Tab"],
    ["Repeat a command", "↑ Up arrow"],
    ["Stop a program", "Ctrl + C"],
  ];
  return [c.bold(`  ${sh.label} cheat sheet`), ...rows.map(([what, how]) => `  ${what.padEnd(24)}${cmd(how)}`)];
}

// ============================================================
// Main program
// ============================================================
let state = null;
let shell = null;
let finished = false; // so closing at the end doesn't print a second goodbye

// Tab completion for file and folder names in the pretend file system
function completer(line) {
  if (!state || !shell) return [[], line];
  const token = line.match(/(\S*)$/)[1];
  const sepIdx = Math.max(token.lastIndexOf("/"), shell.family === "unix" ? -1 : token.lastIndexOf("\\"));
  const dirPart = token.slice(0, sepIdx + 1);
  const namePart = token.slice(sepIdx + 1);
  const r = resolvePath(state, shell, dirPart || ".");
  if (r.error) return [[], token];
  const n = getNode(state, r.segs);
  if (!n || n.node.type !== "dir") return [[], token];
  const sep = shell.family === "unix" ? "/" : "\\";
  const hits = Object.keys(n.node.children)
    .filter((k) => k.toLowerCase().startsWith(namePart.toLowerCase()))
    .map((k) => dirPart + k + (n.node.children[k].type === "dir" ? sep : ""));
  return [hits, token];
}

function guessShell() {
  if (process.platform === "darwin" || process.platform === "linux") return 0;
  if (process.platform === "win32") {
    if (process.env.MSYSTEM) return 3; // Git Bash sets this
    // PowerShell adds the user's Documents\...\Modules folder to PSModulePath; Command Prompt doesn't
    if ((process.env.PSModulePath || "").toLowerCase().includes("\\documents\\")) return 1;
    return 2;
  }
  return 0;
}

function promptFor(st, sh) {
  const segs = st.cwd;
  if (sh.key === "mac") return `student@macbook ${segs.length ? segs[segs.length - 1] : "~"} % `;
  if (sh.key === "gitbash") return null; // two-line prompt, handled below
  if (sh.family === "ps") return `PS ${displayPath(sh, segs)}> `;
  return `${displayPath(sh, segs)}>`;
}

async function main() {
  const rl = readline.createInterface({ input, output, completer });
  rl.on("SIGINT", () => {
    console.log("\n\n  Ctrl+C stops a running program. That's a good one to remember! Bye for now.\n");
    process.exit(0);
  });
  rl.on("close", () => {
    if (!finished) console.log("\n  Bye for now!\n");
    process.exit(0);
  });

  // ---------- Welcome and pick a terminal ----------
  console.clear();
  console.log(c.bold("\n  COMMAND LINE PRACTICE\n"));
  console.log("  Learn to move around and manage files using only the keyboard.");
  console.log("  This is a practice terminal: " + c.green("nothing on your real computer will change.") + "\n");
  console.log("  Which terminal are you using?\n");
  const guess = guessShell();
  SHELLS.forEach((s, i) => {
    const mark = i === guess ? c.green("  ← looks like this one") : "";
    console.log(`   ${c.bold(i + 1)}) ${s.label.padEnd(24)} ${c.dim(s.tell)}${mark}`);
  });
  console.log();

  while (!shell) {
    const a = (await rl.question(`  Type 1–4, or press Enter for ${guess + 1}: `)).trim();
    const pick = a === "" ? guess : Number(a) - 1;
    if (SHELLS[pick]) shell = SHELLS[pick];
    else console.log(c.yellow("  Just type a number from 1 to 4."));
  }

  const T = TEACH[shell.family];
  state = { fs: freshFileSystem(), cwd: [] };

  console.log(`\n  Great, practising for ${c.bold(shell.label)}.\n`);
  console.log("  How it works:");
  console.log(`  • Each step tells you a command. Type it at the ${shell.key === "gitbash" ? "$" : shell.key === "mac" ? "%" : ">"} prompt and press Enter.`);
  console.log(`  • Type ${cmd("hint")} for help, ${cmd("skip")} to skip a step, ${cmd("help")} for a cheat sheet, or ${cmd("quit")} to leave.`);
  console.log(`  • The commands here are the real ones. They'll work the same in your actual terminal.\n`);
  await rl.question(c.dim("  Press Enter to start..."));

  // ---------- The lessons ----------
  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i];
    console.log("\n" + c.dim("─".repeat(60)));
    console.log(c.bold(`  Step ${i + 1} of ${STEPS.length}: ${step.title}`) + "\n");
    for (const l of step.teach(T, shell)) if (l !== null) console.log(l === "" ? "" : "  " + l);
    console.log();

    let misses = 0;
    while (true) {
      let line;
      if (shell.key === "gitbash") {
        const where = "~" + state.cwd.map((s) => "/" + s).join("");
        console.log(`${c.green("student@LAPTOP")} ${c.magenta("MINGW64")} ${c.yellow(where)}`);
        line = await rl.question("$ ");
      } else {
        line = await rl.question(promptFor(state, shell));
      }

      const word = line.trim().toLowerCase();
      if (word === "quit" || word === "exit") {
        console.log("\n  See you next time!\n");
        finished = true;
        rl.close();
        return;
      }
      if (word === "hint") {
        console.log(c.yellow("  Hint: ") + cmd(step.hint(T, shell)) + "\n");
        continue;
      }
      if (word === "help") {
        console.log();
        cheatSheet(T, shell).forEach((l) => console.log(l));
        console.log();
        continue;
      }
      if (word === "skip") {
        if (step.skip) step.skip(state);
        console.log(c.dim(`  Skipped. (The answer was: ${step.hint(T, shell)})`));
        break;
      }

      const result = run(state, shell, line);
      if (result.clear) {
        console.clear();
        console.log(c.bold(`  Step ${i + 1} of ${STEPS.length}: ${step.title}`) + "\n");
      }
      for (const l of result.lines) console.log(result.error ? c.red(l) : l);
      if (result.tip) console.log(c.yellow("  💡 " + result.tip));

      if (!result.error && result.act && step.done(state, result.act)) {
        const win = typeof step.win === "function" ? step.win(T, shell) : step.win;
        console.log("\n  " + c.green("✔ Nice!") + (win ? " " + win : ""));
        break;
      }

      if (result.error) misses++;
      if (misses === 3) console.log(c.dim("  Stuck? Type hint to see the command."));
    }
  }

  // ---------- Finished ----------
  console.log("\n" + c.dim("─".repeat(60)));
  console.log(c.bold(c.green("\n  🎉 You did it! Here's the website folder you built:\n")));
  console.log("  " + c.blue("my-site/"));
  tree(getNode(state, ["projects", "my-site"]).node).forEach((l) => console.log("  " + l));
  console.log();
  cheatSheet(T, shell).forEach((l) => console.log(l));
  console.log(`\n  Next: open your ${c.bold("real")} terminal and try these commands for yourself.`);
  console.log(`  When you're ready, run a game with ${cmd("node tictactoe.js")}\n`);
  finished = true;
  rl.close();
}

main();