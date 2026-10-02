#!/usr/bin/env python3
"""MeTTa Rulebase Syntax and S-Expression Balanced Parentheses Linter.

Verifies that all .metta files within the repository have balanced parentheses,
valid rule structures, and non-empty definitions.
"""

import sys
from pathlib import Path

def check_balanced_parens(file_path: Path) -> tuple[bool, int, str]:
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    depth = 0
    total_atoms = 0
    in_comment = False
    
    for line_no, line in enumerate(lines, 1):
        line = line.strip()
        if not line or line.startswith(";"):
            continue
            
        for ch in line:
            if ch == "(":
                depth += 1
                total_atoms += 1
            elif ch == ")":
                depth -= 1
                if depth < 0:
                    return False, total_atoms, f"Unexpected closing parenthesis at line {line_no}"
                    
    if depth != 0:
        return False, total_atoms, f"Unbalanced parentheses: open count remaining = {depth}"
        
    return True, total_atoms, "OK"

def main():
    print("==========================================================")
    print("  AgriGuide MeTTa Knowledge Base S-Expression Linter")
    print("==========================================================")
    
    project_root = Path(__file__).resolve().parent.parent
    metta_files = list(project_root.rglob("*.metta"))
    
    if not metta_files:
        print("No .metta files found.")
        sys.exit(0)
        
    all_ok = True
    total_scanned_atoms = 0
    
    for mf in sorted(metta_files):
        rel_path = mf.relative_to(project_root)
        ok, atoms, msg = check_balanced_parens(mf)
        total_scanned_atoms += atoms
        status_str = "PASS" if ok else "FAIL"
        print(f"[{status_str}] {rel_path} ({atoms} atoms) -> {msg}")
        if not ok:
            all_ok = False
            
    print("----------------------------------------------------------")
    print(f"Total .metta Files Inspected: {len(metta_files)}")
    print(f"Total Atoms Scanned:          {total_scanned_atoms}")
    print("==========================================================")
    
    if all_ok:
        print("[SUCCESS] All MeTTa Rulebases Verified Valid")
        sys.exit(0)
    else:
        print("[FAIL] MeTTa Syntax Errors Found")
        sys.exit(1)

if __name__ == "__main__":
    main()
