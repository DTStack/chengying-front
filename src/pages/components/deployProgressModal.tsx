import * as React from 'react';
import {
  Modal,
  Table,
  Progress,
  Tooltip,
  Popconfirm,
  Divider,
  Spin,
  Icon,
  notification,
  Steps,
} from 'antd';
import { connect } from 'react-redux';
import { Dispatch, bindActionCreators } from 'redux';
import * as deployAction from '@/actions/deployAction';
import { AppStoreTypes } from '@/stores';
import { Service } from '@/services';

import Logtail from '@/components/logtail';
const mapStateToProps = (state: AppStoreTypes) => ({
  deployProps: state.UnDeployStore,
});
const mapDispatchToProps = (dispatch: Dispatch) => ({
  actions: bindActionCreators(Object.assign({}, deployAction), dispatch),
});

interface ModalState {
  log_modal_visible: any;
  logpaths: any[];
  log_service_id: any;
  title: string;
  status: any;
  currentStep: number;
  rollbackDbStatu: string;
  rollbackErrmsg: string;
}
interface ModalProps {
  visible: boolean;
  progressType: string;
  deployReacord: any;
  actions?: any;
  onClose?: () => void;
  getDataList?: () => void;
  deployProps?: any;
  clusterId: string | number;
}

const roolbackObj = {
  pending: 'process',
  success: 'finish',
  failed: 'error',
};
@(connect(mapStateToProps, mapDispatchToProps) as any)
class UnDeployModal extends React.Component<ModalProps, ModalState> {
  constructor(props: ModalProps) {
    super(props);
  }

  private timerInterval: any = null;
  public state: ModalState = {
    log_modal_visible: false,
    logpaths: [],
    log_service_id: '',
    status: '',
    title: '',
    currentStep: 0,
    rollbackDbStatu: 'pending',
    rollbackErrmsg: '',
  };

  componentDidMount() {
    const { progressType } = this.props;
    const title = progressType === 'rollback' ? '回滚' : '卸载';
    this.setState(
      {
        title,
      },
      () => {
        this.setState({ currentStep: progressType === 'rollback' ? 0 : 1 });
        progressType === 'rollback'
          ? this.getRollbackDbStatus()
          : this.loadCurrentScreenList(this.props.deployProps.start);
      }
    );
  }

  componentWillUnmount() {
    this.clearIntervals();
  }

  clearIntervals = () => {
    clearInterval(this.timerInterval);
  };

  // 回滚数据库进度
  getRollbackDbStatus = () => {
    this.clearIntervals();
    this.timerInterval = setInterval(async () => {
      const { clusterId, deployReacord } = this.props;
      const {
        data: { data },
      } = await Service.getRollbackDbStatus({
        cluster_id: clusterId,
        product_name: deployReacord.product_name,
      });

      if (data.rollback_status === 'success') {
        this.setState({ currentStep: 1 });
        this.loadCurrentScreenList(this.props.deployProps.start);
      } else if (data.rollback_status === 'failed') {
        this.clearIntervals();
      }

      this.setState({ 
        rollbackDbStatu: data.rollback_status,
        rollbackErrmsg: data.rollback_msg
      });
    }, 3000);
  };

  // 回滚组件进度
  loadCurrentScreenList = (currentStart?: number) => {
    this.clearIntervals();
    this.timerInterval = setInterval(async () => {
      const { progressType, actions, deployProps, getDataList } = this.props;
      await actions.getCurrentUnDepolyList({
        deployUuid: deployProps.deploy_uuid,
        start: currentStart || 0,
        limit: 20,
        status: this.state.status,
      });
      // 兼容回滚逻辑
      if (
        (deployProps.complete !== 'undeploying' &&
          progressType === 'unDeploy') ||
        (deployProps.complete !== 'deploying' && progressType === 'rollback')
      ) {
        clearInterval(this.timerInterval);
      }
      if (
        deployProps.complete === 'undeployed' ||
        deployProps.complete === 'deployed'
      ) {
        notification.success({
          message: '提示',
          description:
            progressType === 'unDeploy' ? '卸载成功！' : '回滚成功！',
          duration: 0,
        });
        // 临时处理方案，更新卸载组件列表数据
        getDataList();
      } else if (
        (deployProps.complete !== 'undeploying' &&
          progressType === 'unDeploy') ||
        (deployProps.complete !== 'deploying' && progressType === 'rollback')
      ) {
        notification.error({
          message: '提示',
          description:
            progressType === 'unDeploy' ? '卸载失败！' : '回滚失败！',
          duration: 0,
        });
      }
    }, 3000);
  };

  // 跳转最后一屏数据
  loadLastScreen = () => {
    this.props.actions.getUnDepolyList({
      deployUuid: this.props.deployProps.deploy_uuid,
      start:
        this.props.deployProps.count - 20 > 0
          ? this.props.deployProps.count - 20
          : 0,
      limit: 20,
      status: this.state.status,
    });
  };

  // 卸载详情
  showDeployLog = (e: any) => {
    const schema = JSON.parse(e.schema ? e.schema : '{}');
    this.setState({
      log_modal_visible: true,
      logpaths: schema.Instance ? schema.Instance.Logs : [],
      log_service_id: e.instance_id,
    });
  };

  // 强制成功之后操作
  forceSuccessRefesh = () => {
    this.props.actions.getCurrentUnDepolyList({
      deployUuid: this.props.deployProps.deploy_uuid,
      start: this.props.deployProps.start || 0,
      limit: 20,
      status: this.state.status,
    });
  };

  initColumns = () => {
    const { title } = this.state;
    return [
      {
        title: '执行时间',
        dataIndex: 'update_time',
      },
      {
        title: '服务名称',
        dataIndex: 'service_name',
      },
      {
        title: '服务版本号',
        dataIndex: 'service_version',
      },
      {
        title: '主机IP',
        dataIndex: 'ip',
      },
      {
        title: '组件版本号',
        dataIndex: 'product_version',
      },
      {
        title: `${title}进度`,
        dataIndex: 'progressbar',
        render: (e: any, record: any) => {
          // 区分强制卸载，强制停止
          const isForce =
            record.status_message === 'force uninstall' ||
            record.status_message === 'force stop';
          return (
            <Progress
              percent={record.progress}
              status={
                record.status === 'stop fail' ||
                record.status === 'uninstall fail' ||
                isForce
                  ? 'exception'
                  : 'normal'
              }
            />
          );
        },
      },
      {
        title: `${title}状态`,
        dataIndex: 'status',
        filters:
          this.props.deployProps.complete !== 'undeploying'
            ? [
                {
                  text: 'uninstalling',
                  value: 'uninstalling',
                },
                {
                  text: 'uninstall fail',
                  value: 'uninstall fail',
                },
                {
                  text: 'uninstalled',
                  value: 'uninstalled',
                },
                {
                  text: 'stopping',
                  value: 'stopping',
                },
                {
                  text: 'stopped',
                  value: 'stopped',
                },
                {
                  text: 'stop fail',
                  value: 'stop fail',
                },
              ]
            : [],
        render: (text: any, record: any) => {
          let serviceStatus = {};
          switch (record.status) {
            case 'install fail':
            case 'run fail':
            case 'health-check fail':
            case 'health-check cancelled':
            case 'undeploy fail':
            case 'undeploying':
            case 'stop fail':
            case 'uninstall fail':
              serviceStatus = {
                color: '#FF5F5C',
              };
              break;
            case 'undeployed':
            case 'installed':
            case 'health-checked':
              serviceStatus = {
                color: '#12BC6A',
              };
              break;
          }
          return (
            <div>
              <span style={serviceStatus}>{text}</span>
              <Tooltip title={record.status_message}>
                {record.status_message ? (
                  <Icon style={{ marginLeft: 3 }} type="info-circle" />
                ) : null}
              </Tooltip>
            </div>
          );
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        render: (e: any, record: any) => {
          // const forceStart = this.props.deployProps.start - 20 > 0 ? this.props.deployProps.start - 20 : 0
          let isShowLog = false;
          const schema = JSON.parse(record.schema ? record.schema : '{}');
          if (schema && schema.Instance && schema.Instance.Logs) {
            isShowLog = true;
          }
          let isShowExt = false; // 是否显示强制停止或者强制卸载按钮
          let isStop = false;
          switch (record.status) {
            case 'stop fail':
              isShowExt = true;
              isStop = true;
              break;
            case 'uninstall fail':
              isShowExt = true;
              isStop = false;
              break;
            default:
              isShowExt = false;
              isStop = false;
          }
          return (
            <span>
              {isShowLog ? (
                <a onClick={() => this.showDeployLog(record)}>{title}详情</a>
              ) : isShowExt ? null : (
                '-'
              )}
              {isShowExt ? (
                <Popconfirm
                  title={isStop ? '是否强制停止!' : '是否强制卸载!'}
                  okText="是"
                  cancelText="否"
                  onConfirm={() => {
                    // 调取不同接口
                    isStop
                      ? this.props.actions.forceStop(
                          record.id,
                          this.forceSuccessRefesh
                        )
                      : this.props.actions.forceUninstall(
                          record.id,
                          this.forceSuccessRefesh
                        );
                  }}>
                  <span>
                    {isShowLog ? <Divider type="vertical" /> : null}
                    {isStop ? (
                      <a style={{ color: '#E6432C' }}>强制停止</a>
                    ) : (
                      <a style={{ color: '#E6432C' }}>强制卸载</a>
                    )}
                  </span>
                </Popconfirm>
              ) : null}
            </span>
          );
        },
      },
    ];
  };

  handleTableChange = (pagination, filters, sorter) => {
    this.clearIntervals();
    this.props.actions.getUnDepolyList({
      deployUuid: this.props.deployProps.deploy_uuid,
      start: 0,
      limit: 20,
      status: filters.status.join(',').toString(),
    });
  };

  // 关闭弹框
  modalClose = () => {
    this.setState({
      log_modal_visible: false,
    });
  };

  render() {
    const {
      visible,
      onClose,
      deployReacord,
      deployProps,
      progressType,
    } = this.props;
    const { title, currentStep, rollbackDbStatu, rollbackErrmsg } = this.state;
    const columns = this.initColumns();
    return (
      <div>
        <Modal
          title={
            <span>
              <span className="title__span--progress">{title}</span>
              <span className="title__span--component">
                组件名称：{`${deployReacord.product_name_display}`}
              </span>
              <span className="title__span--component">
                组件版本号：{`${deployReacord.product_version}`}
              </span>
            </span>
          }
          width="1000px"
          footer={null}
          maskClosable={false}
          visible={visible}
          onCancel={onClose}>
          <div className="table-pagination_wraper">
            {progressType === 'rollback' && (
              <Steps current={currentStep} size="small" className="deploy-step">
                <Steps.Step
                  title="回滚数据库"
                  status={roolbackObj[rollbackDbStatu]}
                />
                <Steps.Step title="回滚组件" />
              </Steps>
            )}
            {currentStep === 0 ? (
              <div className="deploy-database">
                {rollbackDbStatu === 'pending' && (
                  <div className="backuping">
                    <Icon type="reload" spin /> 数据库回滚中，请耐心等待
                  </div>
                )}
                {rollbackDbStatu === 'failed' && (
                  <div className="failed">
                    <span>回滚失败!</span>
                    <div>
                      <p>查看日志</p>
                      <p>{rollbackErrmsg}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Table
                  rowKey="id"
                  size="small"
                  className="border-table"
                  bordered={true}
                  columns={columns}
                  pagination={false}
                  onChange={this.handleTableChange}
                  dataSource={deployProps.unDeployList}
                />
                {deployProps.complete === 'undeploying' && (
                  <div className="table-pagination_wraper_spin">
                    <Spin />
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
        <Modal
          title={`${title}详情`}
          visible={this.state.log_modal_visible}
          onCancel={this.modalClose}
          onOk={this.modalClose}
          width={800}>
          <Logtail
            logs={this.state.logpaths}
            serviceid={this.state.log_service_id}
            isreset={!this.state.log_modal_visible}
          />
        </Modal>
      </div>
    );
  }
}
export default UnDeployModal;
