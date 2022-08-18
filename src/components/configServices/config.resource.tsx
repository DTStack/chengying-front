import * as React from 'react';
import { Switch, Input, Row, message, Button, Modal, Icon, Tag } from 'antd';
import CustomTransfer from '@/components/customTransfer';
import installGuideService from '@/services/installGuideService';
import { isEqual } from 'lodash';
declare const window: any;

interface Prop {
  hasInstance: boolean;
  maxSelected: number;
  handleCancel: () => void;
  handleResourceSubmit: Function;
  isCloud: boolean;
  existIp: any[];
  serviceKey: string;
  selectedKeys: any[];
  targetKeys: any[];
  syncHost: Function;
  hostList: any[];
  selectedProduct: any;
  Instance: any;
  installGuideProp: any;
  actions: any;
  isKubernetes?: boolean;
}
interface State {
  targetKeys: any[];
  dataList: any[];
  selectedKeys: any[];
  isCloud_state: boolean;
  cloudHost: string;
  showBtn: boolean;
  isTransferChange: boolean;
  showAutoBtn: boolean;
}

class Resource extends React.Component<Prop, State> {
  constructor(props: Prop) {
    super(props);
  }

  state: State = {
    targetKeys: [],
    dataList: [],
    selectedKeys: [],
    isCloud_state: this.props.isCloud,
    cloudHost: '',
    showBtn: false,
    isTransferChange: false,
    showAutoBtn: false,
  };

  componentDidMount() {
    // if(this.state.selectedKeys.length === 0 && this.state.targetKeys.length === 0)
    console.log(this.props);
    if (this.props.hasInstance) {
      this.setState(
        {
          targetKeys: this.props.targetKeys,
          selectedKeys: this.props.selectedKeys,
        },
        () => {
          this.initDataRight();
        }
      );
    } else {
      this.setState({
        cloudHost: this.props.existIp.toString() || '',
      });
    }
  }

  componentDidUpdate(prevProps: Prop) {
    if (!isEqual(this.props, prevProps)) {
      // 没有instance的时候就没有transferchange
      if (this.state.isTransferChange && this.props.hasInstance) {
        this.setState({
          isTransferChange: false,
        });
        return;
      }
      this.computeRealTargetKeys(this.props);
      if (!this.props.hasInstance) {
        this.setState({
          cloudHost: this.props.existIp.toString() || '',
        });
        return;
      }
      this.setState(
        {
          dataList: [],
          selectedKeys: [],
        },
        () => {
          // this.initDataRight();
          this.setState({
            isCloud_state: this.props.isCloud,
            cloudHost: this.props.isCloud ? this.props.existIp.toString() : '',
          });
        }
      );
      this.initData_left(this.props.hostList);
    }
  }

  computeRealTargetKeys = (nextProp: Prop) => {
    const f: any[] = [];
    // tslint:disable-next-line
    nextProp.isCloud === this.state.isCloud_state &&
      nextProp.existIp.forEach((o: any) => {
        this.props.hostList.forEach((q: any) => {
          if (q.ip === o) {
            f.push(q.id);
          }
        });
      });

    this.setState(
      {
        targetKeys: f,
      },
      () => {
        this.initDataRight(f);
      }
    );
  };

  // 处理数据，分页左面板
  initData_left = (list: any) => {
    this.setState({
      selectedKeys: [],
      dataList: list,
    });
  };

  // 处理数据，分页右面板数据
  initDataRight = (targetKeys?: string[]) => {
    this.setState({
      selectedKeys: [],
      targetKeys,
    });
  };

  handleChange = (targetKeys: any, direction: any, moveKeys: any) => {
    if (targetKeys.length > this.props.maxSelected) {
      message.error(`IP数量限制${this.props.maxSelected},目前超出限制！`);
      const flagP = targetKeys.filter((tar) => !moveKeys.includes(tar));
      this.setState({
        targetKeys: flagP,
      });
      return;
    }
    // 保存至后端
    this.props.handleResourceSubmit({
      isCloud: this.state.isCloud_state,
      hosts:
        this.state.isCloud_state || !this.props.hasInstance
          ? this.state.cloudHost
          : targetKeys,
    });
    this.setState(
      {
        showBtn: true,
        isTransferChange: false,
      },
      () => {
        this.initDataRight(targetKeys);
      }
    );
  };

  handleSelect = (e: any, p: any) => {
    this.setState({
      selectedKeys: [...e, ...p],
    });
  };

  // 后端需要在切换调用(将true, false传入)具体逻辑他也不知道。
  handleChangeSwitch = () => {
    this.props.handleResourceSubmit({
      isCloud: this.state.isCloud_state,
      // hosts: [],
      hosts:
        this.state.isCloud_state || !this.props.hasInstance
          ? this.state.cloudHost
          : this.state.targetKeys,
    });
  };

  useCloudChange = (e: boolean) => {
    this.setState(
      {
        isCloud_state: e,
        showBtn: true,
      },
      () => {
        this.handleChangeSwitch();
        this.computeRealTargetKeys(this.props);
      }
    );
  };

  handleCloudHostChange = (e: any) => {
    this.setState({
      cloudHost: e.target.value,
      showBtn: true,
    });
  };

  handleCancel = (e: any) => {
    this.props.handleCancel();

    const f: any = [];
    this.props.hostList.forEach((q: any) => {
      if (this.props.existIp.includes(q.ip)) {
        f.push(q.id);
      }
    });
    this.setState({
      selectedKeys: [],
      targetKeys: f,
      isCloud_state: this.props.isCloud,
    });
  };

  handleInputBlur = () => {
    console.log('失去焦点了哦');
    this.props.handleResourceSubmit({
      isCloud: this.state.isCloud_state,
      hosts:
        this.state.isCloud_state || !this.props.hasInstance
          ? this.state.cloudHost
          : this.state.targetKeys,
    });
  };

  filterOption = (inputValue: any, option: any) =>
    option.ip.indexOf(inputValue) > -1;

  handleGetAutoConfig = () => {
    installGuideService
      .getAutoConfig({
        productName: this.props.selectedProduct.ProductName,
        serviceName: this.props.serviceKey,
        productVersion: this.props.selectedProduct.ProductVersion,
      })
      .then((res) => {
        console.log(res);
        if (res.data.code === 0) {
          // this.setState({showLoading:'block'})
          const baseClusterId = this.props.installGuideProp.baseClusterId;
          this.props.actions.getProductServicesInfo(
            {
              productName:
                this.props.installGuideProp.selectedProduct.ProductName,
              productVersion:
                this.props.installGuideProp.selectedProduct.ProductVersion,
              unSelectService:
                this.props.installGuideProp.unSelectedServiceList,
              baseClusterId: baseClusterId === -1 ? undefined : baseClusterId,
              clusterId: this.props.installGuideProp.clusterId,
            },
            (res: any) => {
              for (const fk in res) {
                for (const sk in res[fk]) {
                  if (
                    sk ===
                    this.props.installGuideProp.selectedService.serviceKey
                  ) {
                    this.props.actions.setSelectedConfigService({
                      ...res[fk][sk],
                      serviceKey: sk,
                    });
                  }
                }
              }
              this.props.actions.updateServiceHostList({
                productName:
                  this.props.installGuideProp.selectedProduct.ProductName,
                serviceName:
                  this.props.installGuideProp.selectedService.serviceKey,
              });
            }
          );
          this.setState({ showAutoBtn: false });
          message.success('配置完成！');
        } else {
          message.error('配置失败！');
        }
      });
  };

  handleAutoConfig = () => {
    this.setState({ showAutoBtn: true });
    const that = this;
    Modal.confirm({
      title: '确定使用自动配置吗？',
      content: '系统将会为该服务自动分配主机。',
      icon: <Icon type="exclamation-circle" theme="filled" />,
      okType: 'danger',
      onOk() {
        that.handleGetAutoConfig();
      },
      onCancel() {
        console.log('Cancel');
        that.setState({ showAutoBtn: false });
      },
    });
  };

  trasnferItemRender = (ip: string) => {
    let target = window.hostRoleMap.find((item) => item.ip === ip);
    if (!target) {
      target = {};
    }
    const { role_info = [] } = target;
    return (
      <span>
        <span>{ip}</span>
        <span style={{ marginLeft: '20px' }}>
          {role_info.map((role, index) => (
            <Tag
              key={index}
              style={{
                borderRadius: '11px',
              }}>
              {role.role_name}
            </Tag>
          ))}
        </span>
      </span>
    );
  };

  render() {
    const { dataList, isCloud_state, targetKeys } = this.state;

    const autoBtn = (
      <div style={{ position: 'absolute', right: 30 }}>
        <Button
          icon="apartment"
          type="primary"
          ghost
          onClick={this.handleAutoConfig}
          disabled={this.state.showAutoBtn}>
          自动配置
        </Button>
      </div>
    );
    const {
      selectedProduct: { Status },
      Instance = {},
    } = this.props;

    const autoBtnShow =
      !isCloud_state &&
      Status === 'undeployed' &&
      Instance.MaxReplica != undefined;
    return (
      <div className="resource-container">
        <div>
          {this.props.hasInstance && (
            <Row
              style={{
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
              }}>
              <div className="ml-10 mr-20" style={{ fontSize: 12 }}>
                使用外部主机:
              </div>
              <div>
                <Switch
                  style={{ marginTop: '-3px' }}
                  className="switch"
                  checked={this.state.isCloud_state}
                  onChange={(e) => {
                    this.useCloudChange(e);
                  }}
                />
              </div>
              {/* 注释自动配置功能 */}
              {/* {autoBtnShow && autoBtn} */}
            </Row>
          )}
        </div>
        {this.state.isCloud_state || !this.props.hasInstance ? (
          <div>
            <Row style={{ display: 'flex' }}>
              <div style={{ textAlign: 'right', paddingRight: 20, width: 116 }}>
                IP地址:
              </div>
              <div>
                <Input.TextArea
                  style={{ width: 500 }}
                  value={this.state.cloudHost}
                  onBlur={this.handleInputBlur}
                  onChange={(e) => this.handleCloudHostChange(e)}
                  placeholder="可填写多个IP地址，多个IP地址用英文逗号分割开，如172.10.16.2,172.10.20.6。"
                />
              </div>
            </Row>
          </div>
        ) : (
          !this.props.isKubernetes && (
            <Row>
              <CustomTransfer
                rowKey={(record: any) => record.id}
                dataSource={dataList}
                showSearch
                onChange={this.handleChange}
                filterOption={this.filterOption}
                selectedKeys={this.state.selectedKeys}
                targetKeys={targetKeys}
                render={(item: any) => this.trasnferItemRender(item.ip)}
                onSelectChange={this.handleSelect}
                listStyle={{
                  flex: 1,
                  height: 450,
                }}
              />
            </Row>
          )
        )}
      </div>
    );
  }
}
export default Resource;
