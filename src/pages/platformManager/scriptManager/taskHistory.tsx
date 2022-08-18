import React, { useState, useEffect } from 'react';
import { Modal, Table, Badge, Pagination, message } from 'antd';
import { scriptManager } from '@/services';
import './style.scss';
import { RESULT_STATUS } from '../const';
import { EllipsisText } from 'dt-react-component';

interface IProps {
  title: string;
  visible: boolean;
  close: () => void;
  id: number;
}

const renderStatus = (type: any) => {
  switch (type) {
    case RESULT_STATUS.NORMAL:
      return (
        <span>
          <Badge color="#12BC6A" /> 正常
        </span>
      );
    case RESULT_STATUS.UNNORMAL:
      return (
        <span>
          <Badge color="#FF5F5C" /> 异常
        </span>
      );
    case RESULT_STATUS.RUN:
      return (
        <span>
          <Badge color="#3F87FF" /> 运行中
        </span>
      );
    case RESULT_STATUS.UNRUN:
      return (
        <span>
          <Badge color="#BFBFBF" /> 未运行
        </span>
      );
  }
};

const TaskHistory: React.FC<IProps> = (props) => {
  const { title, visible, close, id } = props;
  const [data, setData] = useState([]);
  const [start, setStart] = useState(0);
  const [total, setTotal] = useState(0);
  const columns = [
    {
      title: '编号',
      dataIndex: 'count',
      key: 'count',
      width: 80,
    },
    {
      title: '执行时间',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 150,
      render: (text: string) => {
        return <span>{text || '--'}</span>;
      },
    },
    {
      title: '主机IP',
      dataIndex: 'ip',
      width: 130,
      key: 'ip',
      render: (text: string) => {
        return <span>{text || '--'}</span>;
      },
    },
    {
      title: '执行结果',
      dataIndex: 'exec_status',
      key: 'exec_status',
      render: renderStatus,
    },
    {
      title: '详情',
      dataIndex: 'exec_result',
      key: 'exec_result',
      render: (text: string) => {
        return (
          <div>
            {text?.length > 20 ? (
              <EllipsisText value={text} maxWidth={260} />
            ) : (
              <span>{text || '--'}</span>
            )}
          </div>
        );
      },
    },
  ];

  const getLog = () => {
    const param = {
      id,
      limit: 10,
      start: start,
    };
    scriptManager.getTaskLog(param).then((res: any) => {
      setData([]);
      const { data } = res;
      if (data.code == 0) {
        data.data.list.map((item: any, index: number) => {
          item.count = data.data.count - start - index;
          item.key = item.count;
          return item;
        });
        setData(data.data.list);
        setTotal(data.data.count);
      } else {
        message.error(data.data.msg);
      }
    });
  };

  useEffect(() => {
    if (!visible) {
      return;
    }
    // 调用接口
    getLog();
  }, [id, visible, start]);

  // 改变页码数
  const onChangePage = (page: number) => {
    setStart((page - 1) * 10);
  };

  return (
    <Modal
      title={title}
      visible={visible}
      onCancel={close}
      width="750px"
      footer={null}>
      <Table pagination={false} columns={columns} dataSource={data} />
      <div
        className="paginationBox"
        style={{ padding: '13px 20px 13px 0', textAlign: 'right' }}>
        <Pagination
          current={start / 10 + 1}
          size="small"
          total={total}
          onChange={onChangePage}
          showTotal={(total) => (
            <span>
              共<span style={{ color: '#3F87FF' }}>{total}</span>
              条数据，每页显示
              <span style={{ color: '#3F87FF' }}>10</span>条
            </span>
          )}
        />
      </div>
    </Modal>
  );
};
export default TaskHistory;
