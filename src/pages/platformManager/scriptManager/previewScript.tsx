import React from 'react';
import { Modal } from 'antd';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-golang';
import 'ace-builds/src-noconflict/mode-powershell';
import 'ace-builds/src-noconflict/theme-kuroir';
import * as _ from 'lodash';
import './style.scss'

interface IProps {
    title: string;
    visible: boolean;
    close: () => void;
    content: string;
}

const PreviewScript: React.FC<IProps> = (props) => {
    const {title, visible, close, content} = props;
    return (
        <Modal
            title={title}
            visible={visible}
            onCancel={close}
            width='520px'
            footer={null}
        >
            <AceEditor
                className="ace-code-portal"
                mode="golang"
                theme="kuroir"
                value={content}
                readOnly={true}
                width="520"
                showGutter={false}
            />
        </Modal>
    )
}

export default PreviewScript;

