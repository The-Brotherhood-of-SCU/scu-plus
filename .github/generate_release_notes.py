import os
import subprocess
import re
import json

duplicated=[]

def filter(commit:str)->bool:
    lower=commit.lower()
    if lower in duplicated:
        return True
    duplicated.append(lower)
    pattern=r"updates? \(.+?\)"
    if re.search(pattern,lower):
        return True
    return False

def get_release_notes():
    # 定义通用的subprocess参数
    subprocess_kwargs = {
        'shell': True,
        'text': True,
        'encoding': 'utf-8'
    }
    
    # 获取上一个tag
    try:
        commit_id = subprocess.check_output(
            "git rev-list --tags --skip=1 --max-count=1",
            **subprocess_kwargs
        ).strip()
        prev_tag = subprocess.check_output(
            f"git describe --abbrev=0 --tags {commit_id}",
            **subprocess_kwargs
        ).strip()
    except subprocess.CalledProcessError as e:
        prev_tag = None
    
    print(f"prev_tag: {prev_tag}")

    # 根据是否有上一个tag获取commit日志
    if not prev_tag:
        notes = subprocess.check_output(
            "git log --pretty=format:\"- %s (%an)\" --no-merges",
            **subprocess_kwargs
        )
    else:
        notes = subprocess.check_output(
            f"git log {prev_tag}..HEAD --pretty=format:\"- %s (%an)\" --no-merges",
            **subprocess_kwargs
        )
    #filter "update"
    notes = "\n".join([note for note in notes.split("\n") if not filter(note)])
    
    return f"### 主要更新\n\n{notes}"

def set_version_env():
    """从package.json读取版本号并设置到GitHub Actions环境变量env.title"""
    with open('package.json', 'r', encoding='utf-8') as f:
        version = json.load(f)['version']
    
    print(f"version: {version}")

    if "GITHUB_ENV" in os.environ:
        with open(os.environ["GITHUB_ENV"], "a", encoding='utf-8') as f:
            f.write(f"title=scu+ {version}\n")

if __name__ == "__main__":
    import sys
    import io
    
    # Set stdout to use UTF-8 encoding
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    release_notes = "请下载 chrome-mv3-prod.zip 文件\n\n"+get_release_notes()
    print(release_notes)
    
    set_version_env()
    
    if "GITHUB_ENV" in os.environ:
        with open(os.environ["GITHUB_ENV"], "a", encoding='utf-8') as f:
            f.write(f"release_notes<<EOF\n{release_notes}\nEOF\n")
    else:
        print("GITHUB_ENV not found. Release notes not exported.")
