export const RuleListData = [
  {
    id: 72,
    dashboardId: 38,
    dashboardUid: 'EYgiUM7mz',
    dashboardSlug: 'elasticsearch',
    panelId: 28,
    name: 'ElasticSearch Avg Heap in 5min alert',
    state: 'alerting',
    newStateDate: '2019-01-16T16:28:12+08:00',
    evalDate: '0001-01-01T00:00:00Z',
    evalData: {},
    executionError: '',
    url: '/d/EYgiUM7mz/elasticsearch',
  },
  {
    id: 73,
    dashboardId: 38,
    dashboardUid: 'EYgiUM7mz',
    dashboardSlug: 'elasticsearch',
    panelId: 65,
    name: 'ElasticSearch GC seconds alert',
    state: 'alerting',
    newStateDate: '2019-07-05T11:27:24+08:00',
    evalDate: '0001-01-01T00:00:00Z',
    evalData: null,
    executionError: '',
    url: '/d/EYgiUM7mz/elasticsearch',
  },
  {
    id: 71,
    dashboardId: 37,
    dashboardUid: 'IcCFqQimk',
    dashboardSlug: 'kafka',
    panelId: 13,
    name: 'Kafka Consumer dt_all_log_group alert',
    state: 'alerting',
    newStateDate: '2019-01-16T16:28:32+08:00',
    evalDate: '0001-01-01T00:00:00Z',
    evalData: null,
    executionError: '',
    url: '/d/IcCFqQimk/kafka',
  },
  {
    id: 74,
    dashboardId: 39,
    dashboardUid: '6-kPlS7ik',
    dashboardSlug: 'mysql',
    panelId: 29,
    name: 'Mysql Connections alert',
    state: 'alerting',
    newStateDate: '2019-01-16T16:28:09+08:00',
    evalDate: '0001-01-01T00:00:00Z',
    evalData: null,
    executionError: '',
    url: '/d/6-kPlS7ik/mysql',
  },
  {
    id: 66,
    dashboardId: 34,
    dashboardUid: 'Poa_jiDmz',
    dashboardSlug: 'jlogclickhouse',
    panelId: 52,
    name: 'jvm_gc_full_related alert',
    state: 'no_data',
    newStateDate: '2019-01-16T16:28:03+08:00',
    evalDate: '0001-01-01T00:00:00Z',
    evalData: null,
    executionError: '',
    url: '/d/Poa_jiDmz/jlogclickhouse',
  },
  {
    id: 68,
    dashboardId: 35,
    dashboardUid: 's6FyCiviz',
    dashboardSlug: 'jlogindexer',
    panelId: 52,
    name: 'jvm_gc_full_related alert',
    state: 'no_data',
    newStateDate: '2019-01-16T16:28:15+08:00',
    evalDate: '0001-01-01T00:00:00Z',
    evalData: null,
    executionError: '',
    url: '/d/s6FyCiviz/jlogindexer',
  },
  {
    id: 70,
    dashboardId: 36,
    dashboardUid: 'ZlbJZgDmk',
    dashboardSlug: 'jlogserver',
    panelId: 52,
    name: 'jvm_gc_full_related alert',
    state: 'no_data',
    newStateDate: '2019-01-16T16:28:10+08:00',
    evalDate: '0001-01-01T00:00:00Z',
    evalData: null,
    executionError: '',
    url: '/d/ZlbJZgDmk/jlogserver',
  },
  {
    id: 65,
    dashboardId: 34,
    dashboardUid: 'Poa_jiDmz',
    dashboardSlug: 'jlogclickhouse',
    panelId: 54,
    name: 'process_cpu_percent alert',
    state: 'no_data',
    newStateDate: '2019-01-16T16:28:20+08:00',
    evalDate: '0001-01-01T00:00:00Z',
    evalData: null,
    executionError: '',
    url: '/d/Poa_jiDmz/jlogclickhouse',
  },
  {
    id: 67,
    dashboardId: 35,
    dashboardUid: 's6FyCiviz',
    dashboardSlug: 'jlogindexer',
    panelId: 54,
    name: 'process_cpu_percent alert',
    state: 'no_data',
    newStateDate: '2019-01-16T16:28:48+08:00',
    evalDate: '0001-01-01T00:00:00Z',
    evalData: null,
    executionError: '',
    url: '/d/s6FyCiviz/jlogindexer',
  },
  {
    id: 69,
    dashboardId: 36,
    dashboardUid: 'ZlbJZgDmk',
    dashboardSlug: 'jlogserver',
    panelId: 54,
    name: 'process_cpu_percent alert',
    state: 'no_data',
    newStateDate: '2019-01-16T16:28:30+08:00',
    evalDate: '0001-01-01T00:00:00Z',
    evalData: null,
    executionError: '',
    url: '/d/ZlbJZgDmk/jlogserver',
  },
];

export const AlertRuleProps = {
  HeaderStore: {
    cur_product: {
      product_id: -1,
      product_name: '选择产品',
    },
    products: [
      {
        create_time: '2018-12-28 11:41:46',
        deploy_time: '2019-01-02 13:42:40',
        id: '1',
        is_current_version: 1,
        product: {
          ParentProductName: 'DTinsight',
          ProductName: 'DTBase',
          ProductVersion: '1.0.2',
        },
        product_name: 'DTBase',
        product_version: '1.0.2',
        status: 'deployed',
      },
    ],
    cur_parent_product: 'DTinsight',
    parentProducts: [
      {
        create_time: '2018-12-28 11:41:46',
        deploy_time: '2019-01-02 13:42:40',
        id: '1',
        is_current_version: 1,
        product: {
          ParentProductName: 'DTinsight',
          ProductName: 'DTBase',
          ProductVersion: '1.0.2',
        },
        product_name: 'DTBase',
        product_version: '1.0.2',
        status: 'deployed',
      },
    ],
    cur_parent_cluster: {
      id: 0,
      name: 'test',
      type: 'hosts',
      version: '',
      mode: 0, // 0 自建，1接入
    },
    parentClusters: [
      {
        id: 0,
        name: 'test',
        type: 'hosts',
        version: '',
        mode: 0, // 0 自建，1接入
      },
    ],
  },
  authorityList: {},
};