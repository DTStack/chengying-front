import * as React from 'react';
import { Modal, Upload, Icon, message, Table, Button } from 'antd';
import { productLine } from '@/services';
const { confirm } = Modal;

interface IProps{
    callList: () => void;
    visible: boolean;
    dataList: any;
    onCancel: () => void;
}

const UploadProductLine: React.FC<IProps> = (props) => {
    const {visible, callList, dataList, onCancel} = props;

    const deleteProductLine = (record) => {
        confirm({
            title: '确定删除产品线?',
            okText: '确定',
            okType: 'danger',
            cancelText: 'No',
            onOk() {
              doDelete(record)
            },
            onCancel() {
              console.log('Cancel');
            },
          });
    }

    const doDelete = (record) => {
        productLine.deleteProductLine({id: record.id}).then((res) => {
          console.log(res)
            if (res.data.code == 0) {
                message.success('操作成功！')
                callList()
            } else {
                message.error(res.data.msg)
            }
        })
    }

    const customRequest = async (options) => {
      const formData = new FormData();
      formData.append('file', options.file);
      const res = await productLine.uploadProductLine(formData)
      if (res.data.code == 1) {
        message.success('上传成功！');
        // 刷新列表
      } else {
        message.error(res.data.msg)
      }

    }

    const uploadProductLine = {
        name: 'file',
        customRequest: (options) => customRequest(options),
        accept: '.json',
        fileList: []
    }

    const columns = [
        {
            title: '产品线名称',
            dataIndex: 'product_line_name',
            key: 'product_line_name',
            render: (text, record) => (<span>{text} （{record.product_line_version}）</span>),
        },
        {
            width: 80,
            title: '操作',
            key: 'action',
            className: 'actionName',
            render: (text, record) => (
                <Button type="link" onClick={() => deleteProductLine(record)}>删除</Button>
            ), 
        }
    ]


    return (
        <Modal
            visible={visible}
            onCancel={onCancel}
            className='uploadProductLineModal'
            title='上传产品线'
            footer={null}
        >
             <Upload {...uploadProductLine}>
                    <Icon type="upload" /> 上传产品线 <span className='uploadTxt'>仅支持.json格式文件</span>
              </Upload>
              <div className='uploadProductTable'>
                <Table columns={columns} dataSource={dataList} pagination={false}/>
              </div>
        </Modal>
    )
}

export default UploadProductLine;