import subprocess
import json
import re


def get_remotes():
    # 执行git命令获取远程分支列表
    result = subprocess.run(
        ['git', 'remote'],
        capture_output=True,
        text=True,
        check=True
    )
    
    actual_branches = []
    for line in result.stdout.splitlines():
        stripped_line = line.strip()
        # 排除包含'->'的符号引用行和空行
        if '->' not in stripped_line and stripped_line:
            actual_branches.append(stripped_line)
    
    return actual_branches

def has_unsaved_changes():
    result = subprocess.run(
        ['git', 'status', '--porcelain'],
        capture_output=True,
        text=True,
        check=True
    )
    changed_files = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    return len(changed_files) > 0, changed_files

def get_remote_url(origin):
    result = subprocess.run(
        ['git', 'remote',"get-url",origin],
        capture_output=True,
        text=True,
        check=True
    )
    return result.stdout.strip()

def verify_pattern(version:str)->bool:
    pattern=r"^\d+\.\d+\.\d+$"
    if not re.match(pattern,version):
        return False
    return True

def get_latest_tag():
    # 定义通用的subprocess参数
    subprocess_kwargs = {
        'shell': True,
        'text': True,
        'encoding': 'utf-8'
    }
    
    # 获取上一个tag
    try:
        commit_id = subprocess.check_output(
            "git rev-list --tags --skip=0 --max-count=1",
            **subprocess_kwargs
        ).strip()
        prev_tag = subprocess.check_output(
            f"git describe --abbrev=0 --tags {commit_id}",
            **subprocess_kwargs
        ).strip()
    except subprocess.CalledProcessError as e:
        prev_tag = None
    return prev_tag

def get_version_increase(version:str):
    a,b,c=version.split(".")
    return f"{a}.{b}.{int(c)+1}"

def commit_changes(new_version:str):
    print("提交更改...")
    try:
        subprocess.run(
            ['git', 'add', '.'],
            check=True,
            capture_output=True,
            text=True
        )
        subprocess.run(
            ['git', 'commit', '-m', f'update version code to {new_version}'],
            check=True,
            capture_output=True,
            text=True
        )
        print("提交成功")
    except subprocess.CalledProcessError as e:
        if "nothing to commit" in e.stderr:
            print("没有需要提交的更改，跳过提交")
        else:
            print(f"提交失败: {e.stderr}")
            raise

def create_tag(tag_name:str):
    print(f"创建tag {tag_name}...")
    subprocess.run(
        ['git', 'tag', tag_name],
        check=True
    )

def push_tag(remote:str,tag_name:str):
    print(f"推送tag {tag_name} 到 {remote}...")
    subprocess.run(
        ['git', 'push', remote, tag_name],
        check=True
    )

remotes = get_remotes()
assert len(remotes)==1, "存在多个远程分支，当前脚本仅支持单个远程分支"

remote = remotes[0]
url = get_remote_url(remote)
print(f"当前远程: {remote} {url}")

latest_tag=get_latest_tag()

with open('package.json', 'r', encoding='utf-8') as f:
    version = json.load(f)['version']
print(f"当前版本(package.json): {version} ; 最新tag: {latest_tag}")

uncommitted_changes, changed_files = has_unsaved_changes()
if uncommitted_changes:
    print("存在未提交的更改:",end="")
    for file in changed_files:
        print(f"{file[file.find(' ')+1:]},",end="")
    print("请先提交或暂存更改。")
    exit(1)
done=False
new_version_default=get_version_increase(version)
while not done:
    new_version=input(f"请输入新的版本号(默认:{new_version_default}):")
    if not new_version:
        new_version=new_version_default
    if verify_pattern(new_version):
        done=True
    else:
        print("版本号格式错误，应为x.y.z")

tag_name_default=f"v{new_version}"
tag_name=input(f"请输入新tag名称(默认:{tag_name_default}):")
if not tag_name:
    tag_name=tag_name_default

print(f"即将修改package.json中的版本号为:{new_version}，并创建tag {tag_name}，然后推送。")
print("请确认是否继续？(y/n)")
confirm=input()
if confirm.lower()!='y':
    print("已取消操作。")
    exit(0)

#modify package.json
with open('package.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
data['version'] = new_version
with open('package.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

commit_changes(new_version)
create_tag(tag_name)
push_tag(remote,tag_name)