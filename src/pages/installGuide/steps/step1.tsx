import * as React from 'react';
import {
  Button,
  Upload,
  Table,
  Icon,
  Radio,
  message,
  Modal,
  Checkbox,
  Select,
} from 'antd';
import { difference, isEqual } from 'lodash';
import { installGuideService } from '@/services';
import { deployStatusFilter } from '@/constants/const';
import Step1SetModal from './step1SetModal';
import { EnumDeployMode } from './types';

const Option = Select.Option;

interface State {
  productPackageList: any[];
  fileList: any[];
  filters: any[];
  deploy_status: any;
  modalShow: any;
}
const CheckboxGroup = Checkbox.Group;

class StepOne extends React.Component<any, State> {
  setmodal: any;
  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    const { isK8s } = this.props;
    this.props.getOrchestrationHistory();
    installGuideService
      .getProductNames({ product_type: !this.props.isKubernetes ? 0 : 1 })
      .then((res: any) => {
        res = res.data;
        if (res.code !== 0) {
          message.error(res.msg);
          return;
        }
        res.data.forEach((o: string) => {
          this.state.filters.push({
            text: o,
            value: o,
          });
        });
        if (isK8s) {
          this.props.updateParentState({
            deployMode: EnumDeployMode.MANUAL,
          });
        }
        this.setState({
          filters: this.state.filters,
        });
      });
  }

  componentDidUpdate(prevProps: any) {
    const prevProductPackageList =
      prevProps.installGuideProp.productPackageList;
    const { productPackageList } = this.props.installGuideProp;
    if (!isEqual(prevProductPackageList, productPackageList)) {
      this.setState({ productPackageList });
    }
    if (
      JSON.stringify(this.props.installGuideProp.selectedProduct) === '{}' &&
      JSON.stringify(this.props.defaultSelectedProduct) !== '{}'
    ) {
      this.initSelectedProduct();
    }
  }

  state: State = {
    productPackageList: this.props.installGuideProp.productPackageList,
    // productServices:[],
    fileList: [],
    filters: [],
    deploy_status: '',
    modalShow: false,
  };

  uploadOnChange = (info: any): void => {
    if (info.file.response) {
      if (info.file.response.code !== 0) {
        message.error(info.file.response.msg);
      } else {
        message.success(`${info.file.name} 上传成功！`);
        // 刷新列表
        this.props.actions.getProductPackageList({
          limit: 0,
          product_type: !this.props.isKubernetes ? 0 : 1,
        });
        if (info.file.response.data) {
          message.warning(info.file.response.data);
        }
      }
    }
  };

  handleProductSelected = (record: any) => {
    console.log(this.props.actions);
    if (this.props.isKubernetes) {
      // 检测是否有依赖关系
      this.props.actions.getBaseClusterList(
        {
          clusterId: this.props.installGuideProp.clusterId,
          namespace: this.props.installGuideProp.namespace,
          pid: record.ID,
        },
        (state) => {
          if (!state.baseClusterInfo.hasDepends || state.baseClusterId !== -1) {
            // const id = baseClusterId === -1 ? undefined : baseClusterId;
            // console.log(state)
            // debugger
            this.props.actions.resetInstallGuideConfig();
            if (!state.baseClusterId) return;
            this.getProductPackageServices(record, state.baseClusterId);
          }
        }
      );
    } else {
      this.getProductPackageServices(record);
    }
    // 如果是其他地方进来，那就执行获取未选择，更新未选择值，默认为空。  然后选中的值默认全部，需要再去派发一次，全部和未选择筛选
    // this.props.actions.getUncheckedService(record.ID)
    // 保存选中的产品包信息
    this.props.actions.saveInstallInfo(record);
  };

  // 获取组件
  getProductPackageServices = (
    selectedProduct: any,
    relynamespace?: string | -1
  ) => {
    this.props.actions.getProductPackageServices({
      productName: selectedProduct.ProductName,
      productVersion: selectedProduct.ProductVersion,
      pid: selectedProduct.ID,
      clusterId: this.props.installGuideProp.clusterId,
      relynamespace: relynamespace === -1 ? undefined : relynamespace,
      namespace: this.props.installGuideProp.namespace,
    });
  };

  handleDeleteProductPackage = (e: any) => {
    Modal.confirm({
      title: '确定删除此安装包？',
      content: '删除后，再次部署时需要再次上传。',
      icon: <Icon type="exclamation-circle" theme="filled" />,
      okType: 'danger',
      onOk: () => {
        installGuideService
          .deleteProducyPackage({
            productName: e.ProductName,
            productVersion: e.ProductVersion,
          })
          .then((res: any) => {
            if (res.data.code === 0) {
              this.setState({});
              this.props.actions.getProductPackageList({
                limit: 0,
                product_type: !this.props.isKubernetes ? 0 : 1,
              });
            } else {
              message.error(res.data.msg);
            }
          });
      },
    });
  };

  initSelectedProduct = () => {
    const params = this.props.defaultSelectedProduct;
    this.state.productPackageList.forEach((o: any) => {
      if (
        params.product_name === o.ProductName &&
        params.product_version === o.ProductVersion &&
        params.id === o.ID.toString()
      ) {
        this.handleProductSelected(o);
      }
    });
  };

  changeCheckbox = (checkedValue) => {
    const { productServices } = this.props.installGuideProp;
    const allProductService = productServices.map(
      (item: any) => item.serviceName
    );
    const unSelect = difference(allProductService, checkedValue);
    this.props.actions.saveSelectedService(checkedValue);
    this.props.actions.saveUnSelectedService(unSelect);
  };

  getProductServicePromise = ({ isKubernetes, productRecord }) => {
    const params = {
      productName: productRecord.ProductName,
      productVersion: productRecord.ProductVersion,
      pid: productRecord.ID,
      clusterId: this.props.installGuideProp.clusterId,
      baseClusterId: undefined,
    };

    if (isKubernetes) {
      return installGuideService
        .getBaseClusterList({
          clusterId: this.props.installGuideProp.clusterId,
          namespace: this.props.installGuideProp.namespace,
          pid: productRecord.ID,
        })
        .then((res) => {
          res = res.data;
          if (res.code === 0) {
            const { candidates, targets, message, hasDepends } = res.data;
            const cluster = candidates.find(
              (item: any) => item.relynamespace === targets.relynamespace
            );
            const payload = {
              baseClusterInfo: {
                baseClusterList: candidates,
                hasDepends: hasDepends,
                dependMessage: message,
              },
              baseClusterId: cluster
                ? targets.relynamespace === 0
                  ? -1
                  : targets.relynamespace
                : -1,
            };
            return payload;
          } else {
            throw new Error(res.msg);
          }
        })
        .then(({ baseClusterId, baseClusterInfo }) => {
          if (!baseClusterInfo.hasDepends || baseClusterId !== -1) {
            const id = baseClusterId === -1 ? undefined : baseClusterId;
            params.baseClusterId = id;
            return installGuideService.getProductPackageServices(params);
          }
        })
        .then((res) => {
          const { data } = res.data;
          return data;
        });
    } else {
      return installGuideService
        .getProductPackageServices(params)
        .then((res) => {
          const { data } = res.data;
          return data;
        })
        .catch(() => {
          message.error('获取组件失败');
        });
    }
  };

  tableColInit = () => {
    const { deployMode } = this.props;
    return [
      {
        title: '产品包名称',
        dataIndex: 'ProductNameDisplay',
        filters: this.state.filters,
        filterMultiple: false,
        render: (e: any, record: any) => {
          return (
            <div>
              {deployMode === EnumDeployMode.MANUAL && (
                <Radio
                  checked={
                    record.ID === this.props.installGuideProp.selectedProduct.ID
                  }
                  onChange={() => this.handleProductSelected(record)}
                />
              )}
              {deployMode === EnumDeployMode.AUTO && (
                <Checkbox
                  style={{ marginRight: '20px' }}
                  checked={
                    this.props.autoSelectedProducts.findIndex(
                      (product) => product.ID === record.ID
                    ) > -1
                  }
                  onChange={(e) => {
                    const { autoSelectedProducts } = this.props;

                    if (e.target.checked === true) {
                      this.getProductServicePromise({
                        productRecord: record,
                        isKubernetes: this.props.isKubernetes,
                      }).then((data) => {
                        const sortedData = data.sort(
                          (a, b) => a.baseProduct.length - b.baseProduct.length
                        );
                        // 默认全部勾选
                        const checked = sortedData
                          .filter((service) => service.baseProduct === '')
                          .map((service) => service.serviceName);
                        const disabled = sortedData
                          .filter((product) => product.baseProduct !== '')
                          .map((item) => item.serviceName);

                        // 此处逻辑，当product版本冲突时，需将第一个版本移除
                        const nextAutoSelectedProduct =
                          autoSelectedProducts.filter(
                            (product) =>
                              product.productName !== record.ProductName
                          );
                        nextAutoSelectedProduct.push({
                          ID: record.ID,
                          productName: record.ProductName,
                          productVersion: record.ProductVersion,
                          service: {
                            all: sortedData,
                            checked: checked,
                            unChecked: [],
                            disabled,
                          },
                        });
                        this.props.updateParentState({
                          autoSelectedProducts: nextAutoSelectedProduct,
                        });
                      });
                    } else {
                      this.props.updateParentState({
                        autoSelectedProducts: autoSelectedProducts.filter(
                          (item) => item.ID !== record.ID
                        ),
                      });
                    }
                  }}
                />
              )}
              <span>{e}</span>
            </div>
          );
        },
      },
      {
        title: '版本号',
        dataIndex: 'ProductVersion',
      },
      {
        title: '部署状态',
        dataIndex: 'Status',
        filters: [
          ...deployStatusFilter,
          {
            text: '未部署',
            value: 'undeployed',
          },
        ],
        render: (e: string, record: any) => {
          let state: React.ReactNode = '';
          switch (e) {
            case 'deploying':
              state = <span>{'部署中'}</span>;
              break;
            case 'deployed':
              state = <span>{'已部署'}</span>;
              break;
            case 'deploy fail':
              state = <span>{'部署失败'}</span>;
              break;
            case 'undeploying':
              state = <span>{'卸载中'}</span>;
              break;
            case 'undeploy fail':
              state = <span>{'卸载失败'}</span>;
              break;
            case 'undeployed':
            default:
              state = <span>{'未部署'}</span>;
              break;
          }
          return <span>{state}</span>;
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        render: (e: any, record: any) => {
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}>
              <a
                style={{
                  marginRight: '10px',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  this.setState({
                    modalShow: record,
                  });
                }}>
                <Icon type="setting" />
              </a>
              {/* {
                                    record.Status === 'undeployed' ? (
                                        <a
                                            href="javascript:;"
                                            onClick={() => this.handleDeleteProductPackage(record)}
                                        >
                                            <Icon type="delete" />
                                        </a>
                                    ) : null
                                } */}
            </div>
          );
        },
      },
    ];
  };

  handleTableChange = (pagi: any, filter: any, sorter: any) => {
    this.props.actions.getProductPackageList({
      limit: 0,
      product_type: !this.props.isKubernetes ? 0 : 1,
      product_name:
        filter.ProductNameDisplay && filter.ProductNameDisplay.toString(),
      deploy_status: filter.Status && filter.Status.join(',').toString(),
    });
  };

  serviceUpdate = (params: any) => {
    installGuideService
      .serviceUpdate(params, {
        field_path: 'Instance.RunUser',
        field: params.field,
      })
      .then((res: any) => {
        if (res.data.code === 0) {
          const form = this.setmodal;
          message.success('设置成功！');
          this.setState({
            modalShow: false,
          });
          form.resetFields();
        } else {
          message.error(res.data.msg);
        }
      });
  };

  // 选择依赖
  handleBaseClusterChange = (relynamespace: string) => {
    const { selectedProduct } = this.props.installGuideProp;
    this.props.actions.saveSelectBaseCluster(relynamespace);
    this.getProductPackageServices(selectedProduct, relynamespace);
  };

  handleDeployModeChange = (e) => {
    this.props.updateParentState({
      deployMode: e.target.value,
    });
    if (e.target.value === EnumDeployMode.AUTO) {
      this.props.getOrchestrationHistory();
    } else {
      Modal.info({
        title:
          '如果手动部署模式选择了主机，切换至自动部署模式，则自动编排功能将不可用。',
      });
    }
  };

  render() {
    const uploadCfg = {
      name: 'package',
      action: '/api/v2/product/upload',
      headers: {
        authorization: 'authorization-text',
      },
      onChange: this.uploadOnChange,
      accept: '.tar',
    };
    const { productServices, baseClusterId, baseClusterInfo } =
      this.props.installGuideProp;
    const { baseClusterList, hasDepends, dependMessage } = baseClusterInfo;
    const { deployMode } = this.props;
    const radioStyle = {
      display: 'block',
      marginBottom: '20px',
    };

    return (
      <div
        className="step-one-container step-content-container"
        style={{ overflow: 'scroll' }}>
        <div>
          <Radio.Group
            value={deployMode}
            defaultValue={EnumDeployMode.AUTO}
            onChange={this.handleDeployModeChange}>
            {console.log(deployMode)}
            {/* TODO: k8s不支持自动部署，部分代码逻辑需要删除 */}
            <Radio
              disabled={this.props.isK8s}
              style={radioStyle}
              value={EnumDeployMode.AUTO}>
              <span className="radio-main">自动部署</span>
              <span className="radio-tips">
                （支持多个产品包同时部署、支持主机标签自动编排）
              </span>
            </Radio>
            <Radio style={radioStyle} value={EnumDeployMode.MANUAL}>
              <span className="radio-main">手动部署</span>
              <span className="radio-tips">
                （支持单个产品包部署，支持自定义主机配置）
              </span>
            </Radio>
          </Radio.Group>
        </div>
        <div className="header-box">
          <Upload {...uploadCfg}>
            <Button type="primary">
              <Icon type="upload" />
              上传安装包
            </Button>
          </Upload>
          <span style={{ marginLeft: 12 }}>
            您需选择需要安装的产品包，可上传新的安装包，也可重新部署之前的安装包。
          </span>
        </div>
        {deployMode === EnumDeployMode.MANUAL && (
          <div>
            <Table
              pagination={false}
              className="dt-em-table dt-table-border dt-table-last-row-noborder"
              rowKey="ID"
              onChange={this.handleTableChange}
              dataSource={this.state.productPackageList}
              columns={this.tableColInit()}
              expandedRowRender={() => (
                <div style={{ overflow: 'auto' }}>
                  {hasDepends && (
                    <div
                      className="mt-10 mb-10"
                      style={{ margin: '12px 0 0 0', lineHeight: '32px' }}>
                      <Icon
                        type="exclamation-circle"
                        theme="filled"
                        className="mr-8"
                        style={{ color: '#f5a841', lineHeight: '20px' }}
                      />
                      <span className="mr-8" style={{ lineHeight: '20px' }}>
                        {dependMessage}
                      </span>
                      {console.log(baseClusterList)}
                      {baseClusterList.length > 0 && (
                        <Select
                          style={{ width: 264, height: '32px' }}
                          placeholder="请选择依赖集群"
                          value={
                            baseClusterId === -1 ? undefined : baseClusterId
                          }
                          onChange={this.handleBaseClusterChange}>
                          {/* TODO: 当前版本此处baseClusterId的意义已经更改为relynamespace,后续需要变更变量名称 */}
                          {baseClusterList.map((item) => (
                            <Option
                              key={item.relynamespace}
                              value={item.relynamespace}>
                              {item.relynamespace}
                            </Option>
                          ))}
                        </Select>
                      )}
                    </div>
                  )}
                  {!(!hasDepends || baseClusterId !== -1) && (
                    <p style={{ height: '12px' }}></p>
                  )}
                  {(!hasDepends || baseClusterId !== -1) && (
                    <React.Fragment>
                      <div
                        style={{ margin: '12px 0 0 36px', lineHeight: '20px' }}>
                        EasyManager安装程序将安装以下服务：
                      </div>
                      <CheckboxGroup
                        style={{
                          float: 'left',
                          marginBottom: '20px',
                          marginLeft: '36px',
                        }}
                        onChange={(checkedValue) => {
                          this.changeCheckbox(checkedValue);
                        }}
                        value={this.props.installGuideProp.selectedServiceList} // 传值类型及字段待后端确定
                      >
                        {productServices.map((o: any, index: number) => (
                          <p
                            key={`${o.serviceName}-${index}`}
                            style={{ marginTop: '12px', lineHeight: '20px' }}>
                            <Checkbox
                              value={`${o.serviceName}`}
                              disabled={!!o.baseProduct}>
                              <span style={{ marginRight: 10 }}>
                                {o.serviceName}
                              </span>
                              <span>
                                {o.serviceVersion ? o.serviceVersion : ''}
                              </span>
                              <span style={{ marginLeft: 10 }}>
                                {o.baseProduct}
                              </span>
                            </Checkbox>
                          </p>
                        ))}
                      </CheckboxGroup>
                    </React.Fragment>
                  )}
                </div>
              )}
              expandedRowKeys={[this.props.installGuideProp.selectedProduct.ID]}
            />
          </div>
        )}

        {deployMode === EnumDeployMode.AUTO && (
          <div>
            <Table
              pagination={false}
              className="dt-em-table dt-table-border dt-table-last-row-noborder"
              rowKey="ID"
              onChange={this.handleTableChange}
              dataSource={this.state.productPackageList}
              columns={this.tableColInit()}
              expandedRowRender={(record) => {
                const target = this.props.autoSelectedProducts.find(
                  (item) => item.ID === record.ID
                );
                if (!target) return null;
                return (
                  <div>
                    <React.Fragment>
                      <div
                        style={{ margin: '12px 0 0 36px', lineHeight: '20px' }}>
                        EasyManager安装程序将安装以下服务：
                      </div>
                      <CheckboxGroup
                        style={{
                          float: 'left',
                          marginBottom: '20px',
                          marginLeft: '36px',
                        }}
                        onChange={(checkedValue) => {
                          this.props.updateAutoDeployService(
                            target.ID,
                            checkedValue
                          );
                        }}
                        // value={this.props.installGuideProp.selectedServiceList} // 传值类型及字段待后端确定
                        value={[
                          ...target.service.checked,
                          ...target.service.disabled,
                        ]}>
                        {target.service.all.map(
                          (service: any, index: number) => (
                            <p
                              key={`${service.serviceName}-${index}`}
                              style={{ marginTop: '12px', lineHeight: '20px' }}>
                              <Checkbox
                                value={`${service.serviceName}`}
                                disabled={!!service.baseProduct}
                                checked={true}>
                                <span style={{ marginRight: 10 }}>
                                  {service.serviceName}
                                </span>
                                <span>
                                  {service.serviceVersion
                                    ? service.serviceVersion
                                    : ''}
                                </span>
                                <span style={{ marginLeft: 10 }}>
                                  {service.baseProduct}
                                </span>
                              </Checkbox>
                            </p>
                          )
                        )}
                      </CheckboxGroup>
                    </React.Fragment>
                  </div>
                );
              }}
              expandedRowKeys={this.props.autoSelectedProducts.map(
                (item) => item.ID
              )}
            />
          </div>
        )}
        <Modal
          visible={!!this.state.modalShow}
          title="设置"
          okText="保存"
          width={600}
          onOk={() => {
            const form = this.setmodal;
            form.validateFields((err, values) => {
              if (err != null) {
                return;
              }
              this.serviceUpdate(values);
            });
          }}
          onCancel={() => {
            const form = this.setmodal;
            this.setState({
              modalShow: false,
            });
            form.resetFields();
          }}>
          <Step1SetModal
            data={this.state.modalShow}
            ref={(form) => (this.setmodal = form)}
          />
        </Modal>
      </div>
    );
  }
}
export default StepOne;
