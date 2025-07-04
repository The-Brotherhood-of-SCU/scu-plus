import ReactDOM from "react-dom/client"
import type { PlasmoCSConfig } from "plasmo"
import { xpath_query } from "~script/utils"
import { useEffect, useRef, useState } from "react"
import { Space, Input, Button, Card, message, Spin, Row, Col, Statistic, Divider } from 'antd';
import { ArrowLeftOutlined, CloseOutlined } from "@ant-design/icons";

import { Line, Pie } from "@ant-design/charts";

let searchPageScrollTop = 0;

export default () => <></>

export const config: PlasmoCSConfig = {
    matches: [
        "http://zhjw.scu.edu.cn/*",
    ],
    all_frames: true
}
enum PageType {
    SearchPage,
    CourseStats
}


let parameters = {
    kid: "",
}

window.addEventListener("load", () => {
    setTimeout(() => {
        xpath_query('//*[@id="1145143"]/ul/li/ul/li/a', (e) => e.onclick = popupWindow)
    }, 1000);
})

function popupWindow() {
    if (document.querySelectorAll("#course_score").length != 0) {
        return
    }
    const wind = document.createElement("div")
    wind.style.position = "absolute"
    wind.style.top = "100px"
    wind.style.zIndex = "10000"


    wind.setAttribute("id", "course_score")
    document.body.appendChild(wind)
    const root = ReactDOM.createRoot(wind);
    root.render(<PopUp />)
}

function PopUp() {
    const [page, setWebPage] = useState(PageType.SearchPage)
    const [position, setPosition] = useState([100, 100]);
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState([0, 0]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // SearchPage页面的状态提升，防止返回后状态丢失
    const [searchState, setSearchState] = useState({
        keywords: "",
        loading: false,
        data: [],
        page: 1,
        hasMore: true
    });
    const { keywords, loading, data, page: currentPage, hasMore } = searchState;
    const setKeywords = (val: string) => setSearchState(prev => ({ ...prev, keywords: val }));
    const setLoading = (val: boolean) => setSearchState(prev => ({ ...prev, loading: val }));
    const setData = (val: any[]) => setSearchState(prev => ({ ...prev, data: val }));
    const setPage = (val: number) => setSearchState(prev => ({ ...prev, page: val }));
    const setHasMore = (val: boolean) => setSearchState(prev => ({ ...prev, hasMore: val }));

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;  // 只响应左键点击(button 0)

        const target = e.target;
        if (target.closest('#popup-title')) {
            const container = document.getElementById('course_score_content');
            const rect = container.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            setDragging(true);
            setOffset([offsetX, offsetY]);
        }
    };

    const handleMouseMove = (e) => {
        if (dragging) {
            setPosition([
                e.clientX - offset[0],
                e.clientY - offset[1]
            ]);
        }
    };

    const handleMouseUp = () => {
        setDragging(false);
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, offset]);

    const entry = () => {
        switch (page) {
            case PageType.SearchPage:
                return (
                    <div key="114">
                        <SearchPage
                            setWebPage={setWebPage}
                            searchState={{ keywords, loading, data, page: currentPage, hasMore }}
                            setSearchState={{ setKeywords, setLoading, setData, setPage, setHasMore }}
                        />
                    </div>
                );
            case PageType.CourseStats:
                return <div key="514"><CourseStats setWebPage={setWebPage} /></div>;
        }
    }


    const closePopup = () => {
        const popup = document.getElementById('course_score');
        if (popup) {
            popup.remove();
        }
    };
    // 更新SearchPage的滚动位置
    const updateScrollValue = (e: Event) => {
        const target = e.target as HTMLDivElement;
        searchPageScrollTop = target.scrollTop;
    };
    //监听页面切换，保存/恢复SearchPage滚动位置
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (page === PageType.SearchPage && scrollContainer) {
            // 恢复滚动位置
            scrollContainer.scrollTo({ top: searchPageScrollTop });
            scrollContainer.addEventListener('scroll', updateScrollValue)
            return () => {
                if (scrollContainer) {
                    scrollContainer.removeEventListener('scroll', updateScrollValue);
                }
            };
        }
    }, [page]);

    const gotoSearchPage = () => {
        setWebPage(PageType.SearchPage)
    }

    return (
        <div
            id="course_score_content"
            style={{
                position: 'fixed',
                width: '500px',
                height: '600px',
                background: 'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
                borderRadius: '20px',
                left: `${position[0]}px`,
                top: `${position[1]}px`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'  // 添加这行来裁剪超出圆角的内容
            }}
        >
            {/* 窗口标题栏 */}
            <div
                id="popup-title"
                style={{
                    padding: "5px 5px 5px 13px",
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                }}
                onMouseDown={handleMouseDown}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        type="text"
                        onClick={gotoSearchPage}
                        style={{
                            fontSize: '18px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            color: page === PageType.SearchPage ? 'rgba(0, 0, 0, 0.25)' : undefined,
                            cursor: page === PageType.SearchPage ? 'not-allowed' : 'pointer',
                            transition: 'color 0.3s ease-in-out'  // 添加颜色过渡动画
                        }}
                        disabled={page === PageType.SearchPage}
                    >
                        <span style={{ fontSize: '20px' }}><ArrowLeftOutlined /></span>
                    </Button>
                    <h2 style={{
                        margin: 0,
                        marginLeft: '8px', // Add some space between the button and the title
                        lineHeight: '32px',
                        userSelect: 'none',
                        fontWeight: 'bold'
                    }}>选课通</h2>
                </div>
                <Button
                    type="text"
                    onClick={closePopup}
                    style={{
                        fontSize: '18px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <span style={{ fontSize: '20px' }}><CloseOutlined /></span>
                </Button>
            </div>

            {/* 可滚动内容区域 */}
            <div
                ref={scrollContainerRef}
                style={{
                    overflowY: "auto",
                    flex: 1,
                    padding: '16px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0,0,0,0.2) transparent',
                }}
            >
                {entry()}
            </div>
        </div>
    );
}

function SearchPage({
    setWebPage,
    searchState,
    setSearchState
}: {
    setWebPage: (page: PageType) => void;
    searchState: {
        keywords: string;
        loading: boolean;
        data: any[];
        page: number;
        hasMore: boolean;
    };
    setSearchState: {
        setKeywords: (val: string) => void;
        setLoading: (val: boolean) => void;
        setData: (val: any[]) => void;
        setPage: (val: number) => void;
        setHasMore: (val: boolean) => void;
    };
}) {
    // 从props获取状态和更新函数
    const { keywords, loading, data, page, hasMore } = searchState;
    const { setKeywords, setLoading, setData, setPage, setHasMore } = setSearchState;

    const search = async (reset = false) => {
        if (!keywords.trim()) {
            message.warning("请输入课程名进行搜索");
            return;
        }

        setLoading(true);  // 使用props的setLoading
        try {
            const res = await chrome.runtime.sendMessage({
                action: 'request',
                url: `https://duomi.chenyipeng.com/pennisetum/scu/score/search?kname=${encodeURIComponent(keywords)}&page=${reset ? 1 : page}`
            });

            if (!res.success) throw new Error('网络错误');
            const result = JSON.parse(res.data);

            if (result.code === 200) {
                if (reset) {
                    setData(result.data);
                    setHasMore(result.data.length == 15);
                } else {
                    setData([...data, ...result.data]);
                    setHasMore(result.data.length == 15);
                }
            } else {
                message.error(result.msg ?? "搜索失败");
                if (reset) setData([]);
                setHasMore(false);
            }
        } catch (err) {
            message.error("无法连接到服务器，可能是系统正在维护，请稍后再试");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadNextPage = () => {
        setPage(page + 1);
    };

    useEffect(() => {
        if (page > 1) {
            search(false);
        }
    }, [page]);

    const onSearch = () => {
        setPage(1);
        setHasMore(true);
        search(true);
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                <Space.Compact style={{ width: '100%', maxWidth: '500px' }}>
                    <Input
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        onPressEnter={onSearch}
                        placeholder="请输入课程名"
                        allowClear
                    />
                    <Button
                        type="primary"
                        onClick={onSearch}
                        loading={loading}
                        style={{ minWidth: '80px' }}
                    >
                        查询
                    </Button>
                </Space.Compact>
            </div>

            {/* 卡片布局 */}
            {data.length > 0 ? (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    justifyContent: 'flex-start'
                }}>
                    {data.map((item, index) => (
                        <Card
                            key={index}
                            title={item.kname}
                            style={{
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                minWidth: '300px',
                                flexGrow: 1
                            }}
                            onClick={() => {
                                parameters.kid = item.kid
                                setWebPage(PageType.CourseStats)
                            }}
                        >
                            <p><strong>教师：</strong>{item.tname}</p>
                            <p><strong>学分：</strong>{item.credit}</p>
                            <p><strong>评分人数：</strong>{item.count}</p>
                        </Card>
                    ))}
                </div>
            ) : (
                !loading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 0',
                        color: 'rgba(0, 0, 0, 0.45)'
                    }}>
                        {keywords ? '暂无搜索结果' : '请输入课程名进行搜索'}
                    </div>
                )
            )}

            {loading && (
                <div style={{
                    textAlign: 'center',
                    padding: '16px 0',
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                }}>
                    <Spin size="large" />
                </div>
            )}

            {data.length > 0 && hasMore && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <Button
                        type="primary"
                        onClick={loadNextPage}
                        loading={loading}
                        disabled={loading}
                    >
                        下一页
                    </Button>
                </div>
            )}

            {!hasMore && data.length > 0 && (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(0, 0, 0, 0.45)' }}>
                    没有更多内容了
                </div>
            )}
        </div>
    );
}

function CourseStats({ setWebPage }: { setWebPage: (page: PageType) => void }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const url = `https://duomi.chenyipeng.com/pennisetum/scu/score/getDetail?kid=${parameters.kid}`

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const response = await chrome.runtime.sendMessage({
                    action: 'request',
                    url: url
                });
                if (!response.success) {
                    message.error("请求失败!")
                    return
                }
                const result = JSON.parse(response.data);

                if (result.code === 200) {
                    setData(result.data);
                } else {
                    throw new Error('获取数据失败');
                }
            } catch (err) {
                setError(err.message);
                message.error('获取课程数据失败: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [url]);

    if (loading) {
        return (
            <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return <div className="error-container">错误: {error}</div>;
    }

    if (!data) {
        return <div className="no-data">暂无数据</div>;
    }

    // 饼图数据
    const scoreDistribution = [
        { type: '90-100分', value: data.a },
        { type: '80-89分', value: data.b },
        { type: '70-79分', value: data.c },
        { type: '60-69分', value: data.d },
        { type: '0-59分', value: data.e },
    ];

    // 历史分数数据
    const historyData = data.history.map(item => ({
        examTime: item.examTime?.toString() ?? '未知',
        avg: parseFloat(item.avg.toFixed(1)),
        max: item.max,
        min: item.min,
        count: item.count,
    })).sort((a, b) => parseInt(a.examTime) - parseInt(b.examTime));

    // 饼状图配置
    const configPie = {
        data: scoreDistribution,
        angleField: 'value',
        colorField: 'type',
        label: {
            text: 'value',
            position: "spider",
            style: {
                fontWeight: 'bold',
            },
        },
        interactions: [{ type: 'element-active' }],
        height: 200,
        legend: {
            color: {
                title: false,
                position: 'bottom',
                rowPadding: 5,
            },
        },
    };

    // 折线图配置
    const configLine = {
        data: historyData,
        padding: 'auto',
        forceFit: true,
        xField: 'examTime',
        yField: 'avg',
        height: 300,
        lineStyle: {
            stroke: '#4096ff',
            strokeWidth: 2,
        },
        point: {
            size: 4,
            style: {
                fill: '#4096ff',
                stroke: '#fff',
                strokeWidth: 2,
            },
        },
    };

    return (
        <div className="course-stats-container">
            <Card
                title={data.kname}

                styles={{ header: { fontSize: '18px', fontWeight: 'bold' } }}
            >
                <Row gutter={16}>
                    <Col span={8}>
                        <Statistic title="教师" value={data.tname} />
                    </Col>
                    <Col span={8}>
                        <Statistic title="校区" value={data.campusName} />
                    </Col>
                    <Col span={8}>
                        <Statistic title="学分" value={data.credit} />
                    </Col>
                </Row>

                <Divider />

                <Row gutter={16}>
                    <Col span={8}>
                        <Statistic title="平均分" value={data.avg.toFixed(1)} />
                    </Col>
                    <Col span={8}>
                        <Statistic title="最高分" value={data.max} />
                    </Col>
                    <Col span={8}>
                        <Statistic title="最低分" value={data.min} />
                    </Col>
                </Row>

                <Divider />

                <div className="chart-section">
                    <h3>成绩分布</h3>
                    <Pie {...configPie} />
                </div>

                <Divider />

                {historyData.length > 0 && historyData[0].avg != 0 && (
                    <div className="chart-section">
                        <h3>历史考试平均分趋势</h3>
                        <Line {...configLine} />
                    </div>
                )}
            </Card>
            <span style={{color:"grey"}}>数据来源：陈一一的自留地</span>
        </div>
    );
};
