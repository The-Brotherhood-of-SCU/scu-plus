import os
import subprocess
import re

duplicated=[]

def filter(commit:str)->bool:
    lower=commit.lower()
    if lower in duplicated:
        return True
    duplicated.append(lower)
    pattern="updates? \(.+?\)"
    if re.search(pattern,lower):
        return True
    return False

def get_release_notes():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # 获取上一个tag
    try:
        commit_id = subprocess.check_output(
            "git rev-list --tags --skip=1 --max-count=1",
            shell=True,
            text=True,
            cwd=repo_root
        ).strip()
        prev_tag = subprocess.check_output(
            f"git describe --abbrev=0 --tags {commit_id}",
            shell=True,
            text=True,
            cwd=repo_root
        ).strip()
    except subprocess.CalledProcessError as e:
        prev_tag = None
    
    print(f"prev_tag: {prev_tag}")

    # 根据是否有上一个tag获取commit日志
    if not prev_tag:
        notes = subprocess.check_output(
            "git log --pretty=format:\"- %s (%an)\" --no-merges",
            shell=True, text=True
        )
    else:
        notes = subprocess.check_output(
            f"git log {prev_tag}..HEAD --pretty=format:\"- %s (%an)\" --no-merges",
            shell=True, text=True
        )
    #filter "update"
    notes = "\n".join([note for note in notes.split("\n") if not filter(note)])
    
    return f"### 主要更新\n\n{notes}"

if __name__ == "__main__":
    release_notes = get_release_notes()
    print(release_notes)
    if "GITHUB_ENV" in os.environ:
        with open(os.environ["GITHUB_ENV"], "a") as f:
            f.write(f"release_notes<<EOF\n{release_notes}\nEOF\n")
    else:
        print("GITHUB_ENV not found. Release notes not exported.")