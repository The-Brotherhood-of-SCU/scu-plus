import ReactDOM from "react-dom/client"
import type { PlasmoCSConfig } from "plasmo"
import { xpath_query } from "~script/utils"
import { useEffect, useState } from "react"
import { Space, Input, Button, Card, message, Spin, Row, Col, Statistic, Divider } from 'antd';
import { RollbackOutlined } from "@ant-design/icons";

import { Column, Pie } from "@ant-design/charts";
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


let parameters={
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
    root.render(<PopUp/>)
}

function PopUp() {
    const [page, setWebPage] = useState(PageType.SearchPage)
    const [position, setPosition] = useState([100, 100]);
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState([0, 0]);

    const handleMouseDown = (e) => {
        const target = e.target;
        if (target.closest('#course_score_content')) {
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
                return <div key="114"><SearchPage setWebPage={setWebPage} /></div>;
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

    return (
        <div
            id="course_score_content"
            style={{
                position: 'fixed',
                width: '500px',
                height: '600px',
                overflowY: "auto",
                background: 'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
                cursor: 'pointer',
                borderRadius: '30px',
                left: `${position[0]}px`,
                top: `${position[1]}px`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                padding: '10px'
            }}
            onMouseDown={handleMouseDown}
        >
            {/* 窗口标题栏 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center', 
                marginBottom: '16px'
            }}>
                <h2 style={{ 
                    margin: 0,
                    lineHeight: '32px'  
                }}>选课通</h2>
                <Button 
                    type="text" 
                    onClick={closePopup}
                    style={{ 
                        fontSize: '18px',
                        height: '32px', 
                        display: 'flex',
                        alignItems: 'center'  // 确保×符号垂直居中
                    }}
                >
                    <span style={{ fontSize: '24px' }}>×</span>
                </Button>
            </div>
            {entry()}
        </div>
    );
}

function SearchPage({ setWebPage }: { setWebPage: (page: PageType) => void }) {
    const [keywords, setKeywords] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const search = async (reset = false) => {
        if (!keywords.trim()) {
            message.warning("请输入课程名进行搜索");
            return;
        }

        setLoading(true);
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
                    setData(prev => [...prev, ...result.data]);
                    setHasMore(result.data.length == 15);
                }
            } else {
                message.error(result.msg || "搜索失败");
                if (reset) setData([]);
                setHasMore(false);
            }
        } catch (err) {
            message.error("网络请求失败");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadNextPage = () => {
        setPage(prevPage => prevPage + 1);
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
                            onClick={() =>{
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

    // 历史数据柱状图
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

    // 柱状图配置
    const configColumn = {
        data: historyData,
        xField: 'examTime',
        yField: 'avg',
        padding: 'auto',
        appendPadding: [10, 0, 0, 0],
        label: {
            position: 'top',
            style: {
                fill: '#000',
                fontSize: 12,
            },
            text: (datum) => `${datum.avg}`,
        },
        xAxis: {
            label: {
                autoHide: false,
                autoRotate: false,
                style: {
                    fontSize: 12,
                },
            },
        },
        yAxis: {
            nice: true,
            min: 0,
            max: 100,
            label: {
                formatter: (val) => `${val}`,
            },
        },
        style: {
            // 圆角样式
            radiusTopLeft: 10,
            radiusTopRight: 10,
        },
        height: 300,
    };


    const backtohome = () => {
        setWebPage(PageType.SearchPage)
    }

    return (
        <div className="course-stats-container">
            <Button onClick={backtohome}>
                <RollbackOutlined />
                返回</Button>
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

                <div className="chart-section">
                    <h3>历史考试平均分趋势</h3>
                    <Column {...configColumn} />
                </div>
            </Card>
        </div>
    );
};
