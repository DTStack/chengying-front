import * as React from 'react';
import { connect } from 'react-redux';
import {
  Input,
  Button,
  Table,
  Icon,
  message,
  Modal,
  Checkbox,
  Form,
} from 'antd';
import DynamicDropSelect from './DynamicDropSelect';
import { intersection, difference } from 'lodash';
import '../style.scss';
import { AppStoreTypes } from '@/stores';
import { clusterHostService, Service } from '@/services';
import { hostStatusInfoMap } from '@/constants/const';
import utils from '@/utils/utils';
import { columnGenerator } from './constants';

const Search = Input.Search;
const { Item } = Form;

interface IProps {
  cur_parent_cluster: any;
  history: any;
  authorityList: any;
}

interface IModelHost {
  visible: boolean;
  batch: boolean;
  data: {
    sid: number[];
    host: string[];
    roleList: string[];
  };
}
interface IState {
  selectedRowKeys: number[];
  reqParams: {
    cluster_id: number;
    limit: number;
    start: number;
    'sort-by': string;
    'sort-dir': 'desc' | 'asc';
    host_or_ip: string;
    is_running: string;
    status: string;
    group: string;
    role?: string;
  };
  hosts: {
    count: number;
    list: any[];
  };
  hostGroups: any[];
  tableLoading: boolean;
  visibleHostModal: IModelHost;
  // personalInfo: any;
}
type progressStatus = 'exception' | 'active' | 'success';

const mapStateToProps = (state: AppStoreTypes) => ({
  cur_parent_cluster: state.HeaderStore.cur_parent_cluster,
  authorityList: state.UserCenterStore.authorityList,
});

export class Host extends React.PureComponent<IProps, IState> {
  refDropDown = null;
  refModal = null;
  state: IState = {
    selectedRowKeys: [],
    reqParams: {
      cluster_id: 1,
      limit: 10,
      start: 0,
      'sort-by': 'id',
      'sort-dir': 'desc',
      host_or_ip: '',
      is_running: '',
      status: '',
      group: '',
      role: '',
    },
    hosts: {
      count: 0,
      list: [],
    },
    hostGroups: [],
    tableLoading: false,
    visibleHostModal: {
      visible: false,
      batch: false,
      data: {
        sid: [],
        roleList: [],
        host: [],
      },
    },
    // personalInfo: {}
  };

  componentDidMount() {
    this.getHostList();
    this.getClusterhostGroupLists();
    // this.getPersonalUserInfo();
  }

  componentDidUpdate(prevProps: IProps) {
    if (prevProps.cur_parent_cluster.id !== this.props.cur_parent_cluster.id) {
      this.getHostList();
      this.getClusterhostGroupLists();
    }
  }

  // ????????????
  authorityControl = (
    action: string,
    code: string,
    record?: any,
    status?: boolean
  ) => {
    const { authorityList } = this.props;
    if (utils.noAuthorityToDO(authorityList, code)) {
      return;
    }
    switch (action) {
      case 'edit':
        this.handleEditCluster();
        break;
      case 'delete':
        this.handleDeleteHost();
        break;
      case 'roleSet':
        this.handleBatchRoleSet();
        break;
      default:
        break;
    }
  };

  // ??????????????????
  getClusterhostGroupLists = () => {
    const { type, id } = this.props.cur_parent_cluster;
    Service.getClusterhostGroupLists({ type, id }).then((res: any) => {
      res = res.data;
      if (res.code === 0) {
        this.setState({
          hostGroups: (res.data || []).map((item) => ({
            text: item,
            value: item,
          })),
        });
      }
    });
  };

  // ??????????????????
  getHostList = () => {
    const { reqParams } = this.state;
    const { cur_parent_cluster } = this.props;
    this.setState({ tableLoading: true });
    Service.getClusterHostList(
      {
        ...reqParams,
        cluster_id: cur_parent_cluster.id,
        role:
          cur_parent_cluster.type === 'kubernetes' ? reqParams.role : undefined,
      },
      cur_parent_cluster.type
    ).then((res: any) => {
      res = res.data;
      if (res.code === 0) {
        this.setState({
          hosts: {
            count: res.data.count,
            list: res.data.hosts || [],
          },
        });
      } else {
        message.error(res.msg);
      }
      this.setState({ tableLoading: false });
    });
  };

  // ??????
  handleTableChange = (pagination, filters, sorter) => {
    const { cur_parent_cluster } = this.props;
    const reqParams = {
      ...this.state.reqParams,
      start: (pagination.current - 1) * pagination.pageSize,
    };
    // ??????
    if (Object.keys(filters)) {
      reqParams.is_running = (filters.is_running || []).join(',');
      reqParams.status = (filters.status || []).join(',');
      reqParams.group = (filters.group || []).join(',');
      if (cur_parent_cluster.type === 'kubernetes') {
        reqParams.role = (filters.roles || []).join(',');
      }
    }
    // ??????
    if (Object.keys(sorter) && 'order' in sorter) {
      reqParams['sort-by'] = sorter.field;
      reqParams['sort-dir'] = sorter.order === 'ascend' ? 'asc' : 'desc';
    } else {
      reqParams['sort-by'] = 'id';
      reqParams['sort-dir'] = 'desc';
    }
    this.setState(
      {
        reqParams,
      },
      () => {
        this.getHostList();
      }
    );
  };

  // ??????
  handleSearch = (host_or_ip: string) => {
    this.setState(
      {
        reqParams: Object.assign({}, this.state.reqParams, { host_or_ip }),
      },
      this.getHostList
    );
  };

  // ???????????????????????????
  handleEditCluster = () => {
    const {
      cur_parent_cluster,
      history: { location },
    } = this.props;
    const { id, type, mode } = cur_parent_cluster;
    this.props.history.push(
      `/deploycenter/cluster/create/edit?id=${id}&type=${type}&mode=${mode}&from=${location.pathname}`
    );
  };

  // ??????????????????
  progressProp = (status: number) => {
    const { cur_parent_cluster = {} } = this.props;
    switch (status) {
      case 0:
        return {
          percent: 0,
          title: '????????????',
          color: '#FF5F5C',
        };
      case -1:
        return {
          percent: 30,
          status: 'exception' as progressStatus,
          title: '??????????????????',
          color: '#FF5F5C',
        };
      case 1:
        return {
          percent: 30,
          status: 'active' as progressStatus,
          title: '??????????????????',
          color: '#12BC6A',
        };
      case -2:
        return {
          percent: cur_parent_cluster.type === 'hosts' ? 60 : 40,
          status: 'exception' as progressStatus,
          title: 'script????????????',
          color: '#FF5F5C',
        };
      case 2:
        return {
          percent: cur_parent_cluster.type === 'hosts' ? 60 : 40,
          status: 'active' as progressStatus,
          title: 'script????????????',
          color: '#12BC6A',
        };
      case -3:
        return {
          percent: cur_parent_cluster.type === 'hosts' ? 100 : 50,
          status: 'exception' as progressStatus,
          title: '?????????????????????',
          color: '#FF5F5C',
        };
      case 3:
        return {
          percent: cur_parent_cluster.type === 'hosts' ? 100 : 50,
          status: (cur_parent_cluster.type === 'hosts'
            ? 'success'
            : 'active') as progressStatus,
          title: '?????????????????????',
          color: '#12BC6A',
        };
      case -4:
        return {
          percent: 50,
          status: 'exception' as progressStatus,
          title: '????????????',
          color: '#FF5F5C',
        };
      case -5:
        return {
          percent: 60,
          status: 'exception' as progressStatus,
          title: 'K8S DOCKER???????????????',
          color: '#FF5F5C',
        };
      case 5:
        return {
          percent: 60,
          status: 'active' as progressStatus,
          title: 'K8S DOCKER???????????????',
          color: '#12BC6A',
        };
      case -6:
        return {
          percent: 80,
          status: 'exception' as progressStatus,
          title: 'K8S NODE???????????????',
          color: '#FF5F5C',
        };
      case 6:
        return {
          percent: 80,
          status: 'active' as progressStatus,
          title: 'K8S NODE???????????????',
          color: '#12BC6A',
        };
      case -7:
        return {
          percent: 100,
          status: 'exception' as progressStatus,
          title: 'K8S NODE????????????',
          color: '#FF5F5C',
        };
      case 7:
        return {
          percent: 100,
          status: 'success' as progressStatus,
          title: 'K8S NODE????????????',
          color: '#12BC6A',
        };
      default:
        return {
          percent: 100,
          status: 'exception' as progressStatus,
          color: '#333',
        };
    }
  };

  // ????????????
  handleSelectChange = (selectedRowKeys: number[]) => {
    this.setState({ selectedRowKeys });
  };

  // ????????????
  handleDeleteHost = () => {
    const {
      selectedRowKeys,
      hosts: { list = [] },
    } = this.state;
    const filters =
      list.filter(
        (item) => selectedRowKeys.includes(item.id) && !item.is_running
      ) || [];
    if (!filters.length) {
      Modal.confirm({
        title: '??????????????????????????????????????????',
        icon: <Icon type="exclamation-circle" theme="filled" />,
        okText: '??????',
        cancelText: '??????',
        onOk: () => {},
        onCancel: () => {},
      });
    } else {
      Modal.confirm({
        title: '????????????agent???????????????????????????????????????????????????',
        content:
          '?????????????????????????????????????????????????????????????????????????????????????????????',
        icon: <Icon type="exclamation-circle" theme="filled" />,
        okText: '??????',
        cancelText: '??????',
        onOk: async () => {
          const response = await clusterHostService.deleteHost({
            aid: filters.map((item) => item.id),
          });
          const data = response.data;
          if (data.code === 0) {
            message.success('???????????????');
            this.getHostList();
          } else {
            message.error(data.msg);
          }
        },
        onCancel: () => {},
      });
    }
  };

  // ???????????????????????????
  getCheckedIds = () => {
    const { hosts, selectedRowKeys } = this.state;
    const dataSourceIds =
      Array.isArray(hosts.list) && hosts.list.map((item) => item.id);
    const checkedIds = intersection(selectedRowKeys, dataSourceIds);
    return checkedIds;
  };

  // ?????????????????????
  handleFooterChange = (e: any) => {
    const {
      hosts: { list = [] },
    } = this.state;
    const idLists = list.map((item) => item.id);
    let selectedRowKeys = [];
    if (e.target.checked) {
      selectedRowKeys = [...this.state.selectedRowKeys, ...idLists];
    } else {
      selectedRowKeys = difference(this.state.selectedRowKeys, idLists);
    }
    this.setState({ selectedRowKeys });
  };

  // ????????????????????????
  handleBatchRoleSet = () => {
    const { selectedRowKeys, hosts } = this.state;
    const { authorityList } = this.props;
    const authRole = authorityList.sub_menu_role_manage;
    const { list } = hosts;
    const selectedHosts = selectedRowKeys
      .map((id) => list.find((item) => item.id === id))
      // ?????????????????????,???null??????undfined
      .filter((item) => item);
    const sids = selectedHosts.map((item) => item.sid);
    const hostlist = selectedHosts.map((item) => item.ip);
    if (authRole) {
      this.setState({
        visibleHostModal: {
          visible: true,
          batch: true,
          data: {
            sid: sids,
            roleList: [],
            host: hostlist,
          },
        },
      });
    } else {
      message.error('???????????????????????????');
    }
  };

  handleRoleSet = (sid, defaultRoleList = []) => {
    const { hosts } = this.state;
    const { list } = hosts;
    const ip = list.find((item) => item.sid === sid)?.ip;
    this.setState({
      visibleHostModal: {
        visible: true,
        batch: false,
        data: {
          sid: [sid],
          roleList: defaultRoleList,
          host: [ip],
        },
      },
    });
  };

  bindHostRoles = async (sid, roleId, callback) => {
    const params = sid.map((sid) => {
      return {
        sid,
        role_id_list: roleId,
      };
    });
    const res = await clusterHostService.bindHostRoles(params);
    const { code } = res.data;
    if (code === 0) {
      message.success('????????????');
      this.getHostList();
      callback();
    } else {
      message.error('????????????');
    }
  };

  roleBtnRender = (params: any) => {
    if (params.isKubernetesCustom === true) return null;
    const { selectedRowKeys } = params;
    if (selectedRowKeys.length > 0) {
      return (
        <Button
          style={{ marginLeft: 20 }}
          type="primary"
          onClick={() =>
            this.authorityControl('roleSet', 'sub_menu_role_manage')
          }>
          ????????????
        </Button>
      );
    } else {
      return (
        <Button style={{ marginLeft: 20 }} disabled={true}>
          ????????????
        </Button>
      );
    }
  };

  updateRoleList = (roleList) => {
    const { visibleHostModal } = this.state;
    const { data } = visibleHostModal;
    this.setState({
      visibleHostModal: {
        ...visibleHostModal,
        data: {
          ...data,
          roleList: roleList,
        },
      },
    });
  };

  render() {
    const { cur_parent_cluster, authorityList } = this.props;

    const {
      selectedRowKeys,
      reqParams,
      hosts: { list = [], count },
      hostGroups,
      tableLoading,
      visibleHostModal,
    } = this.state;
    const pagination = {
      size: 'small',
      showTotal: (total) => (
        <span>
          ???<span style={{ color: '#3F87FF' }}>{total}</span>????????????????????????
          {reqParams.limit}???
        </span>
      ),
      current: reqParams.start / reqParams.limit + 1,
      pageSize: reqParams.limit,
      total: count,
    };
    const rowSelection = {
      selectedRowKeys,
      onChange: this.handleSelectChange,
    };

    const isKubernetes = cur_parent_cluster.type === 'kubernetes';
    // ???????????????k8s??????
    const isKubernetesCustom = isKubernetes && cur_parent_cluster.mode === 0;
    const statusInfo = hostStatusInfoMap[cur_parent_cluster.type];
    const columns = columnGenerator({
      isKubernetes,
      isKubernetesCustom,
      statusInfo,
      hostGroups,
      progressProp: this.progressProp,
      handleRoleSet: this.handleRoleSet,
      authorityList,
    });

    // Footer?????????
    const checkedIds = this.getCheckedIds();

    const footer = () => (
      <div>
        <Checkbox
          data-testid="check-all-btn"
          style={{ marginRight: 12 }}
          checked={checkedIds.length && checkedIds.length === list.length}
          indeterminate={checkedIds.length && checkedIds.length < list.length}
          onChange={this.handleFooterChange}>
          ??????
        </Checkbox>
        {!selectedRowKeys.length ? (
          <Button disabled>??????</Button>
        ) : (
          <Button
            type="primary"
            onClick={() => this.authorityControl('delete', 'cluster_edit')}>
            ??????
          </Button>
        )}
        {this.roleBtnRender({ isKubernetesCustom, selectedRowKeys })}
      </div>
    );

    return (
      <div className="cluster-page-body">
        <div className="clearfix mb-12">
          <Search
            className="dt-form-shadow-bg"
            style={{ width: 264 }}
            placeholder="?????????ip???????????????"
            onSearch={this.handleSearch}
          />
          <Button
            className="fl-r"
            type="primary"
            onClick={() => this.authorityControl('edit', 'cluster_edit')}>
            ????????????
          </Button>
        </div>
        <Table
          rowKey="id"
          className="dt-table-fixed-contain-footer c-cluster__table"
          style={{ height: 'calc(100vh - 232px)' }}
          dataSource={list}
          pagination={pagination}
          loading={tableLoading}
          scroll={{ y: true }}
          onChange={this.handleTableChange}
          rowSelection={rowSelection}
          columns={columns}
          footer={footer}
        />
        <span
          onClick={() => {
            this.refDropDown.hideSelect();
          }}
          ref={(ref) => (this.refModal = ref)}>
          <Modal
            className="role-hosts-modal"
            visible={visibleHostModal.visible}
            title={visibleHostModal.batch ? '????????????????????????' : '??????????????????'}
            maskClosable={false}
            onCancel={(e) => {
              // ???????????????????????????modal???
              e.stopPropagation();
              const pass = this.refDropDown.hideSelect();
              if (!pass) return;
              this.setState({
                visibleHostModal: {
                  visible: false,
                  batch: this.state.visibleHostModal.batch,
                  data: {
                    sid: [],
                    roleList: [],
                    host: [],
                  },
                },
              });
            }}
            onOk={() => {
              const pass = this.refDropDown?.hideSelect();
              if (!pass) return;

              const { visibleHostModal } = this.state;
              const { data } = visibleHostModal;
              this.bindHostRoles(data.sid, data.roleList, () => {
                // ????????????????????????
                this.setState({
                  visibleHostModal: {
                    visible: false,
                    batch: this.state.visibleHostModal.batch,
                    data: {
                      sid: [],
                      roleList: [],
                      host: [],
                    },
                  },
                });
              });
            }}>
            <Form
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
              className="hosts-role-form">
              {visibleHostModal.batch ? null : (
                <Item label="??????ip">
                  {visibleHostModal.data.host.join(',')}
                </Item>
              )}
              <Item label="????????????">
                <DynamicDropSelect
                  ref={(ref) => (this.refDropDown = ref)}
                  cur_parent_cluster={cur_parent_cluster}
                  container={this.refModal}
                  value={this.state.visibleHostModal.data.roleList}
                  onChange={(value) => {
                    const { visibleHostModal } = this.state;
                    const { host = [] } = visibleHostModal.data;
                    this.setState({
                      visibleHostModal: {
                        ...visibleHostModal,
                        data: {
                          roleList: value,
                          sid: visibleHostModal.data.sid,
                          host,
                        },
                      },
                    });
                  }}
                  updateRoleList={this.updateRoleList.bind(this)}
                />
              </Item>
            </Form>
          </Modal>
        </span>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Host);
