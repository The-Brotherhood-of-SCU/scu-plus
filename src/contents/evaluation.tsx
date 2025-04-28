import type { PlasmoCSConfig } from "plasmo"
import { Button, Input,notification } from "antd"
import { xpath_query } from "~script/utils"
import ReactDOM from "react-dom/client"
import React, { useState } from "react"
import type { NotificationArgsProps } from 'antd';


export const config: PlasmoCSConfig = {
    matches: [
        "http://zhjw.scu.edu.cn/student/teachingEvaluation/newEvaluation/evaluation2*"
    ],
    all_frames: true
}

window.addEventListener("load", () => {
    xpath_query(`//*[@id="page-content-template"]/div/div/div`, (e) => {
        let div = document.createElement("div")
        e.appendChild(div)
        const root = ReactDOM.createRoot(div)
        root.render(<Controller />)
    })
})

function Controller() {
    const [minscore, set_minscore] = useState(80)
    const [maxscore, set_maxscore] = useState(100)
    const [api, contextHolder] = notification.useNotification();
    const openNotification = (placement: NotificationPlacement) => {
        api.info({
            message: `提示`,
            description:
                '你再看看你输入的对不对呢!😡',
            placement,
        });
    };
    const check = () => {
        if (minscore > maxscore || minscore < 0 || minscore > 100 || maxscore < 0 || maxscore > 100) {
            openNotification('top')
        } else {
            do_it(minscore, maxscore)
        }
    }
    return <>
        {contextHolder}
        <div className="parameter" style={{ margin: "30px" }}>
            <label>分数范围：</label>
            <Input style={{ width: "80px",borderRadius:'10px'}} value={minscore} placeholder="最小值" type="number" onChange={(e) => set_minscore(Number(e.target.value))}></Input>
            ~
            <Input style={{ width: "80px", marginRight: "30px" }} placeholder="最大值" value={maxscore} type="number" onChange={(e) => set_maxscore(Number(e.target.value))}></Input>
            <Button onClick={() => check()}>自动填充评估</Button>
        </div>

    </>
}

type NotificationPlacement = NotificationArgsProps['placement'];

function do_it(min: number, max: number) {
    let inputs = document.querySelectorAll('input');
    for (let inp of inputs) {
        if (inp.placeholder == '请输入1-100的整数') {
            inp.value = (Math.floor(Math.random() * 100 % (max - min)) + min).toString()
        }
    }
}

export default () => <></>