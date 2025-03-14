import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { xpath_query } from "~script/utils";

export const config: PlasmoCSConfig = {
    matches: ["http://zhjw.scu.edu.cn/", "http://zhjw.scu.edu.cn/index", "http://zhjw.scu.edu.cn/index.*"],
    all_frames: true,
};

export default () => <></>

window.addEventListener('load', () => {
    xpath_query('//*[@id="page-content-template"]/div[1]/div/div[3]/div[1]', (e) => {
        const app = document.createElement('div')
        app.setAttribute('id', 'hotPost')
        app.style.marginTop = '130px';
        e.appendChild(app)
        const root = ReactDOM.createRoot(app);
        root.render(<HotPost />)
    })
})

async function getPost(set: Function, loading: Function) {
    for (let i = 0; i < 5; i++) {
        loading(true);
        const result = await chrome.runtime.sendMessage({ action: 'request', url: 'https://u.xiaouni.com/user-api/content/article/list?reading=1' })
        if (result.success) {
            let posts: post[] = [];
            const lists = JSON.parse(result.data).data.list;
            lists.forEach(element => {
                posts.push({ title: element.title, id: element.id as number })
            });
            posts = posts.filter((_e, index) => index < 10)
            set(posts)
            loading(false)
            break;
        }
    }
}

function HotPost() {
    const [posts, setposts] = useState<post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => { getPost(setposts, setIsLoading) }, [])

    const getRankColor = (index: number) => {
        if (index === 0) return '#ffd700'; // 金牌
        if (index === 1) return '#c0c0c0'; // 银牌
        if (index === 2) return '#cd7f32'; // 铜牌
        return '#666'; // 常规颜色
    };
    const containerStyle: React.CSSProperties = {
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        padding: '24px',
        maxWidth: '800px',
        margin: '20px auto',
        transition: 'transform 0.2s ease',
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '24px',
        position: 'relative',
    };

    const decorativeLine: React.CSSProperties = {
        width: '4px',
        height: '28px',
        background: '#63589d',
        borderRadius: '2px',
        marginRight: '12px',
    };

    const titleStyle: React.CSSProperties = {
        color: '#2a2543',
        fontSize: '28px',
        fontWeight: 600,
        margin: 0,
    };

    const listContainer: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    };

    const listItemStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        borderRadius: '8px',
        background: '#f8f7fc',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    };

    const rankStyle: React.CSSProperties = {
        fontWeight: 'bold',
        fontSize: '18px',
        minWidth: '32px',
        textAlign: 'center',
        marginRight: '16px',
    };

    const titleTextStyle: React.CSSProperties = {
        fontSize: '16px',
        color: '#444',
        flexGrow: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    };

    const loadingStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 0',
        color: '#666',
    };
    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <span style={decorativeLine} />
                <h2 style={titleStyle}>🎯 今日热帖</h2>
            </div>

            {isLoading ? (
                <div style={loadingStyle}>
                    <div className="loader" />
                    加载中...
                </div>
            ) : (
                <div style={listContainer}>
                    {posts.map((post, index) => (
                        <div
                            key={post.id}
                            style={listItemStyle}
                            className="post-item"
                            onClick={() => window.open(`https://u.xiaouni.com/mobile/pages/pd/pd?id=${post.id}`)}
                        >
                            <span style={{ ...rankStyle, color: getRankColor(index) }}>
                                {index + 1}
                            </span>
                            <span style={titleTextStyle}>{post.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

interface post {
    title: string,
    id: number
}