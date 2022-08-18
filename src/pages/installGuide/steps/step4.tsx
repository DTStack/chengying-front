import * as React from 'react';
import { get } from 'lodash';

import {
  Table,
  Tooltip,
  Progress,
  Spin,
  Row,
  Icon,
  notification,
  Modal,
  Steps,
  message
} from 'antd';

import { servicePageService, deployService } from '@/services';
import { SearchDeployLogs } from '@/model/apis';
import { InstallGuideActionTypes } from '@/actions/installGuideAction';
import { InstallGuideStore } from '@/stores/modals';
import Logtail from '@/components/logtail';
import SpecialPagination from '@/components/pagination';
import FileViewModal from '@/components/fileViewModal';
import FileLogShow from '@/components/fileLogShow';
import utils from '@/utils/utils';
import { Service } from '@/services'
import * as _ from 'lodash';

interface State {
  dataList: any[];
  timerCount: number;
  timerGone: boolean; // 判断是否继续显示带动画效果的进度条
  progressPre: any[];

  log_modal_visible: boolean;
  logpaths: any[];
  log_service_id: any;
  deployFailed: boolean;
  deploySuccess: boolean;
  status: any;
  visibleServiceLog: boolean;
  serviceGroup: any;
  modalContent: string;
  currentStep: number;
  rollbackDbStatu: string;
  rollbackErrmsg: string
}

interface Prop {
  actions: InstallGuideActionTypes;
  installGuideProp: InstallGuideStore;
  isKubernetes: boolean;
}

const roolbackObj = {
  pending: 'process',
  success: 'finish',
  failed: 'error'
}

class StepFour extends React.Component<Prop, State> {
  private timer: any = Object;
  private timerInterval: any = Object;

  private handScroll = false;
  private container = null;

  state: State = {
    dataList: [],
    timerCount: 0,
    timerGone: false,
    progressPre: [],

    log_modal_visible: false,
    logpaths: [],
    log_service_id: '',
    deployFailed: false,
    deploySuccess: false,
    status: '',
    modalContent: null,
    serviceGroup: null,
    visibleServiceLog: false,
    currentStep: 0,
    rollbackDbStatu: 'pending',
    rollbackErrmsg: ''
  };

  handleScroll = _.debounce((e) => {
    const ele: any =
      document.getElementsByClassName('ant-table-row')[
        document.getElementsByClassName('ant-table-row').length - 1
      ];
    if (!ele) return
    console.log(ele.offsetTop);
    if (ele.offsetTop - this.container.scrollTop > 206) {
      this.handScroll = true;
      this.container.removeEventListener('scroll', this.handleScroll);
    }
  }, 100);

  componentDidMount() {
    this.handScroll = false;
    this.container = document.getElementsByClassName('step-main-container')[0];
    this.container.addEventListener('scroll', this.handleScroll);
    this.isRollback() ? this.getRollbackDbStatus() : this.loadDataInter();
    this.setState({ currentStep: this.isRollback() ? 0 : 1 })
  }

  UNSAFE_componentWillMount() {
    this.container &&
      this.container.removeEventListener('scroll', this.handleScroll);
  }

  // 回滚数据库进度
  getRollbackDbStatus = () => {
    clearInterval(this.timer)
    this.timer = setInterval(async () => {
      const { installGuideProp } = this.props;
      const { data: { data } } = await Service.getRollbackDbStatus({
        cluster_id: (utils.getParamsFromUrl(window.location.href) as any).cluster_id,
        product_name: installGuideProp.selectedProduct.ProductName
      });

      if (data.rollback_status === 'success') {
        this.setState({ currentStep: 1 })
        this.loadDataInter()
      } else if (data.rollback_status === 'failed') {
        clearInterval(this.timer)
        message.error('回滚失败！')
      }
      
      this.setState({ 
        rollbackDbStatu: data.rollback_status,
        rollbackErrmsg: data.rollback_msg
      })

    }, 3000);
  }

  loadDataInter = () => {
    clearInterval(this.timer)
    this.timer = setInterval(() => {
      this.setState({
        timerCount: this.state.timerCount + 1,
      });
      this.props.actions.getDeployList({
        uuid: this.props.installGuideProp.deployUUID,
        start: this.props.installGuideProp.start || 0,
        status: '',
      });
      const { complete } = this.props.installGuideProp;
      const isDeploying = complete === 'deploying';
      const isUndeploying =
        this.props.isKubernetes && complete === 'undeploying';

      if (!(isDeploying || isUndeploying)) {
        clearInterval(this.timer);
      }
      if (complete === 'deployed') {
        notification.success({
          message: '提示',
          description: '部署成功！',
          duration: 0,
        });
      } else if (!(isDeploying || isUndeploying)) {
        notification.error({
          message: '提示',
          description: '部署失败！',
          duration: 0,
        });
      }
    }, 3000);
  };

  // 用作判断从“查看进度”跳进来的离开后初始化
  componentWillUnmount() {
    clearInterval(this.timer);
    clearInterval(this.timerInterval);
  }

  componentDidUpdate() {
    if (this.handScroll) return;
    const ele: any =
      document.getElementsByClassName('ant-table-row')[
        document.getElementsByClassName('ant-table-row').length - 1
      ];
    ele &&
      document
        .getElementsByClassName('step-main-container')[0]
        .scrollTo(0, ele.offsetTop);
  }

  // 刷新首页数据
  loadFirstScreenList = () => {
    this.timerInterval = setInterval(() => {
      this.props.actions.getCurrentDeployList({
        uuid: this.props.installGuideProp.deployUUID,
        start: 0,
        status: '',
      });
      const { complete } = this.props.installGuideProp;
      const isDeploying = complete === 'deploying';
      const isUndeploying =
        this.props.isKubernetes && complete === 'undeploying';

      if (!(isDeploying || isUndeploying)) {
        clearInterval(this.timerInterval);
      }
      if (complete === 'deployed') {
        notification.success({
          message: '提示',
          description: '部署成功！',
          duration: 0,
        });
      } else if (!(isDeploying || isUndeploying)) {
        notification.error({
          message: '提示',
          description: '部署失败！',
          duration: 0,
        });
      }
    }, 3000);
  };

  // 刷新当前页数据
  loadCurrentScreenList = (currentStart) => {
    this.timerInterval = setInterval(() => {
      this.props.actions.getCurrentDeployList({
        uuid: this.props.installGuideProp.deployUUID,
        start: currentStart,
        status: '',
      });
      const { complete } = this.props.installGuideProp;
      const isDeploying = complete === 'deploying';
      const isUndeploying =
        this.props.isKubernetes && complete === 'undeploying';

      if (!(isDeploying || isUndeploying)) {
        clearInterval(this.timerInterval);
      }
      if (complete === 'deployed') {
        notification.success({
          message: '提示',
          description: '部署成功！',
          duration: 0,
        });
      } else if (!(isDeploying || isUndeploying)) {
        notification.error({
          message: '提示',
          description: '部署失败！',
          duration: 0,
        });
      }
    }, 3000);
  };

  // 跳转最后一屏数据
  loadLastScreen = () => {
    this.props.actions.getDeployList({
      uuid: this.props.installGuideProp.deployUUID,
      start:
        this.props.installGuideProp.count - 20 > 0
          ? this.props.installGuideProp.count - 20
          : 0,
      status: '',
    });
  };

  clearTimer = () => {
    console.log('清理timer', this.props.installGuideProp.complete);
    const { complete } = this.props.installGuideProp;
    const isDeploying = complete === 'deploying';
    const isUndeploying = this.props.isKubernetes && complete === 'undeploying';
    if (!(isDeploying || isUndeploying)) {
      clearInterval(this.timer);
      clearInterval(this.timerInterval);
    }
  };

  UNSAFE_componentWillReceiveProps(nextProp: any) {
    if (nextProp.installGuideProp.stopDeployBySelf) {
      // this.clearTimer();
    }
  }

  showDeployLog = (e: any) => {
    const schema = JSON.parse(e.schema ? e.schema : '{}');
    this.setState({
      log_modal_visible: true,
      logpaths: schema.Instance.Logs,
      log_service_id: e.instance_id,
    });
  };

  showAllServiceLog = () => {
    const { installGuideProp } = this.props;

    this.setState(
      {
        visibleServiceLog: true,
      },
      () => {
        this.loadServiceGroup({
          product_name: installGuideProp.selectedProduct.ProductName,
        });
        // this.onSelectedLogService('');
      }
    );
  };

  onSelectedLogService = (service: string) => {
    const { installGuideProp } = this.props;
    console.log('onSelectedLogService:', service);
    this.getDeployLog({
      deployId: installGuideProp.deployUUID,
      serviceName: service || '',
      productName: installGuideProp.selectedProduct.ProductName,
      productVersion: installGuideProp.selectedProduct.ProductVersion,
    });
  };

  getDeployLog = (params: SearchDeployLogs) => {
    deployService.searchDeployLog(params).then((res: any) => {
      if (res.data.code === 0) {
        this.setState({
          modalContent: get(res, 'data.data.result', ''),
        });
      }
    });
  };

  loadServiceGroup = (params: any) => {
    servicePageService.getServiceGroup(params).then((res: any) => {
      if (res.data.code === 0) {
        this.setState({
          serviceGroup: get(res, 'data.data.groups', {}),
        });
      }
    });
  };

  initColumns = () => {
    const { complete } = this.props.installGuideProp;
    const columns = [
      {
        title: '执行时间',
        dataIndex: 'update_time',
      },
      {
        title: '产品包名称',
        dataIndex: 'product_name',
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
        title: '部署进度',
        dataIndex: 'progressbar',
        render: (e: any, record: any) => {
          let exceptionStatus = false;
          switch (record.status) {
            case 'install fail':
            case 'run fail':
            case 'health-check fail':
            case 'stop fail':
            case 'health-check cancelled':
              exceptionStatus = true;
              break;
            default:
              exceptionStatus = false;
          }
          return (
            <Progress
              percent={
                // !this.state.timerGone ? record.progress : 100
                record.progress
              }
              status={
                // !this.state.timerGone ? "active" : exceptionStatus ? 'exception' : 'normal'
                exceptionStatus ? 'exception' : 'active'
              }
            />
          );
        },
      },
      {
        title: '启动状态',
        dataIndex: 'status',
        filters:
          complete !== 'deploying' || complete !== 'undeploying'
            ? this.props.isKubernetes
              ? [
                  {
                    text: 'installing',
                    value: 'installing',
                  },
                  {
                    text: 'installed',
                    value: 'installed',
                  },
                  {
                    text: 'install fail',
                    value: 'install fail',
                  },
                  {
                    text: 'uninstalling',
                    value: 'uninstalling',
                  },
                  {
                    text: 'uninstalled',
                    value: 'uninstalled',
                  },
                  {
                    text: 'uninstall fail',
                    value: 'uninstall fail',
                  },
                  {
                    text: 'running',
                    value: 'running',
                  },
                  {
                    text: 'run fail',
                    value: 'run fail',
                  },
                  {
                    text: 'health-checked',
                    value: 'health-checked',
                  },
                  {
                    text: 'health-check fail',
                    value: 'health-check fail',
                  },
                ]
              : [
                  {
                    text: 'installing',
                    value: 'installing',
                  },
                  {
                    text: 'installed',
                    value: 'installed',
                  },
                  {
                    text: 'install fail',
                    value: 'install fail',
                  },
                  {
                    text: 'uninstalling',
                    value: 'uninstalling',
                  },
                  {
                    text: 'uninstalled',
                    value: 'uninstalled',
                  },
                  {
                    text: 'uninstall fail',
                    value: 'uninstall fail',
                  },
                  {
                    text: 'installing cancelled',
                    value: 'installing cancelled',
                  },
                  {
                    text: 'running',
                    value: 'running',
                  },
                  {
                    text: 'run fail',
                    value: 'run fail',
                  },
                  {
                    text: 'health-checked',
                    value: 'health-checked',
                  },
                  {
                    text: 'health-check fail',
                    value: 'health-check fail',
                  },
                  {
                    text: 'health-check cancelled',
                    value: 'health-check cancelled',
                  },
                  {
                    text: 'health-check waiting',
                    value: 'health-check waiting',
                  },
                  {
                    text: 'stopped',
                    value: 'stopped',
                  },
                  {
                    text: 'stopping',
                    value: 'stopping',
                  },
                  {
                    text: 'stop fail',
                    value: 'stop fail',
                  },
                  {
                    text: 'update-config fail',
                    value: 'update-config fail',
                  },
                ]
            : [],
        render: (text: any, record: any) => {
          // tslint:disable-next-line:variable-name
          let service_status = {};
          switch (record.status) {
            case 'install fail':
            case 'run fail':
            case 'stop fail':
            case 'health-check fail':
            case 'health-check cancelled':
              service_status = {
                color: '#FF5F5C',
              };
              break;
            case 'installed':
            case 'health-checked':
              service_status = {
                color: '#12BC6A',
              };
              break;
          }
          return (
            <div>
              <span style={service_status}>{text}</span>
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
        title: '查看',
        dataIndex: 'action',
        render: (e: any, record: any) => {
          const schema = JSON.parse(record.schema ? record.schema : '{}');
          if (schema && schema.Instance && schema.Instance.Logs) {
            return (
              <span>
                <a
                  style={
                    schema.Instance.Logs.length
                      ? { display: 'inline' }
                      : { display: 'none' }
                  }
                  onClick={() => this.showDeployLog(record)}>
                  部署日志
                </a>
              </span>
            );
          } else {
            return '-';
          }
        },
      },
    ];

    return columns;
  };

  handleTableChange = (pagination, filters, sorter) => {
    clearInterval(this.timer);
    clearInterval(this.timerInterval);
    this.props.actions.getDeployList({
      uuid: this.props.installGuideProp.deployUUID,
      start: 0,
      status: filters.status ? filters.status.join(',').toString() : '',
    });
  };

  isRollback = () => {
    const urlParams = (utils.getParamsFromUrl(window.location.href) as any) || {}
    return !!urlParams.isRollback
  }

  render() {
    const { visibleServiceLog, currentStep, rollbackDbStatu, rollbackErrmsg } = this.state;
    const tableCol = this.initColumns();
    // isDeploying控制当前分页是否继续轮询，true继续轮序，false,不在轮询
    const { installGuideProp, isKubernetes } = this.props;
    const isDeploying = this.props.installGuideProp.complete === 'deploying';
    const isUndeploying =
      isKubernetes && this.props.installGuideProp.complete === 'undeploying';
    const currentStart =
      this.props.installGuideProp.start - 20 > 0
        ? this.props.installGuideProp.start - 20
        : 0; // 前一satrt
    const currentLastStart =
      this.props.installGuideProp.count - 20 > 0
        ? this.props.installGuideProp.count - 20
        : 0; // 定位最后start

    const deployFail = installGuideProp.complete === 'deploy fail';
    const deploySuccess = installGuideProp.complete === 'deployed';

    return (
      <div
        className="step-four-container step-content-container"
        style={{ position: 'relative' }}>
        {this.isRollback() && <div className='step-four-container-left'>
          <Steps current={currentStep} size='small' direction="vertical">
            <Steps.Step title="回滚数据库" status={roolbackObj[rollbackDbStatu]}/>
            <Steps.Step title="回滚组件" />
          </Steps>
        </div>}
        {currentStep === 0 && rollbackDbStatu === 'failed' && (
          <div className='step-four-container-right'>
            <div className="failed">
              <p>错误日志</p>
              <div>
                <p>查看日志</p>
                <p>{rollbackErrmsg}</p>
              </div>
            </div>
          </div>
        )}
        {currentStep === 1 && (
          <div className='step-four-container-right'>
            <p className="header-box">
              <Icon
                type="exclamation-circle"
                theme="filled"
                style={{ color: '#3f87ff', marginRight: 8 }}
              />
              产品包中的已选择服务将在主机上开始部署，可查看服务的安装状态及部署详情。
            </p>
            <div
              className="table-box table-pagination_wraper"
              style={{ marginBottom: 30 }}>
              <div>
                <Table
                  rowKey="id"
                  className="dt-em-table dt-table-border dt-table-last-row-noborder"
                  columns={tableCol}
                  pagination={false}
                  dataSource={this.props.installGuideProp.deployList}
                  onChange={this.handleTableChange}
                />
                {isKubernetes && (
                  <FileLogShow
                    wsUrl={`ws://${window.location.host}/api/v2/cluster/kubernetes/${installGuideProp.clusterId}/namespace/${installGuideProp.namespace}/product/${installGuideProp.selectedProduct.ID}/installLog`}
                  />
                )}
                {isDeploying || isUndeploying ? (
                  <div className="table-pagination_wraper_spin">
                    <Spin />
                  </div>
                ) : null}
                {!!this.props.installGuideProp.deployList?.length ? (
                  <SpecialPagination
                    handleClickTop={() => {
                      clearInterval(this.timer);
                      clearInterval(this.timerInterval);
                      // !this.props.installGuideProp.deployFinished ? this.loadFirstScreenList(): null;
                      this.props.actions.getCurrentDeployList({
                        uuid: this.props.installGuideProp.deployUUID,
                        start: 0,
                        status: '',
                      });
                      (isDeploying || isUndeploying) && this.loadFirstScreenList();
                    }}
                    handleClickUp={() => {
                      clearInterval(this.timer);
                      clearInterval(this.timerInterval);

                      this.props.actions.getDeployList({
                        uuid: this.props.installGuideProp.deployUUID,
                        // 请求前20条数据
                        start: currentStart,
                        status: '',
                      });
                      // !this.props.installGuideProp.deployFinished ? this.loadCurrentScreenList() : null;
                      (isDeploying || isUndeploying) &&
                        this.loadCurrentScreenList(currentStart);
                    }}
                    handleClickDown={() => {
                      clearInterval(this.timer);
                      clearInterval(this.timerInterval);
                      this.props.actions.getDeployList({
                        uuid: this.props.installGuideProp.deployUUID,
                        start: currentLastStart,
                        status: '',
                      });
                      (isDeploying || isUndeploying) &&
                        this.loadCurrentScreenList(currentLastStart); // 刷新当前页
                    }}
                    handleClickNew={() => {
                      clearInterval(this.timer);
                      clearInterval(this.timerInterval);
                      this.loadLastScreen(); // 是否跳转最后一页(后端处理)
                      (isDeploying || isUndeploying) &&
                        this.loadCurrentScreenList(currentLastStart); // 刷新当前页
                    }}
                  />
                ) : null}
              </div>
            </div>
            {deployFail || deploySuccess ? (
              <Row
                className="absolute-middle"
                style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  top: 'auto',
                  bottom: '20px',
                }}>
                {deploySuccess ? (
                  <span style={{ color: '#12BC6A' }}>
                    <Icon type="check-circle" /> 部署成功!
                  </span>
                ) : null}
                {deployFail ? (
                  <span style={{ color: '#FF5F5C' }}>
                    <Icon type="close-circle" /> 部署失败!
                  </span>
                ) : null}
                {!isKubernetes && (
                  <span>
                    &nbsp;&nbsp;
                    <a onClick={this.showAllServiceLog}>查看全部部署日志</a>
                  </span>
                )}
              </Row>
            ) : null}
          </div>
        )}
        

        <Modal
          className="logtail-box"
          destroyOnClose={true}
          title="执行日志"
          footer={null}
          width={800}
          visible={this.state.log_modal_visible}
          maskClosable={false}
          onCancel={() => this.setState({ log_modal_visible: false })}>
          <Logtail
            logs={this.state.logpaths}
            serviceid={this.state.log_service_id}
            isreset={!this.state.log_modal_visible}
          />
        </Modal>
        <FileViewModal
          key="deployModal"
          title="部署日志"
          visible={visibleServiceLog}
          content={this.state.modalContent}
          serviceData={this.state.serviceGroup}
          onCancel={() =>
            this.setState({ visibleServiceLog: false, modalContent: null })
          }
          onSelectedService={this.onSelectedLogService}
        />
      </div>
    );
  }
}
export default StepFour;
