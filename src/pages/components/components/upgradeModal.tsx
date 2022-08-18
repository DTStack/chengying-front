import React, { useMemo, useState, useEffect } from 'react';
import { Modal, Form, Select, Alert, Button, Icon, message } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { formItemBaseLayout } from '@/constants/formLayout';
import { deployService, Service } from '@/services';
import CommandPopbox from '@/pages/command/details/popbox';
import { ROLLBACK_STATUS } from '@/constants/const';

const FormItem = Form.Item;
const { Option } = Select;

interface IProps extends FormComponentProps {
  visible: boolean;
  type: string;
  onOk?: (url: string, e?: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  onCancel: (e?: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  options: any[];
  clusterId: string | number;
  record: any;
}

let timer = null;

const UpgradeModal: React.FC<IProps> = (props) => {
  const { visible, type, onOk, onCancel, options, clusterId, record, form } =
    props;
  const { getFieldDecorator, validateFields } = form;
  const [backUpInfo, setBackUpInfo] = useState({
    backup_status: '-',
    backup_time: '',
    product_name: '',
    source_version: '',
    backup_name: '',
    backup_sqls: '',
  });
  const [hasNewBackup, setHasNewBackup] = useState(false);
  const [visibleInfo, changePopboxInfo] = useState({
    visible: false,
    title: '查看日志',
    type: 'log',
    execId: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [versions, setVersionList] = useState<string[]>([]);
  const [backupList, setBackUpList] = useState<string[]>([]);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [title, tips] = useMemo(() => {
    const title = type === 'upgrade' ? '升级' : '回滚';
    const tips: string =
      type === 'upgrade'
        ? '请先备份库，再执行升级部署，部署完成后将自动执行版本间的增量SQL；开始备份后，请勿退出页面，否则将取消本次升级。'
        : '仅支持回滚至 “升级” 操作前的版本，请先备份库，再执行回滚；开始备份后，请勿退出页面，否则将取消本次回滚。';
    return [title, tips];
  }, []);

  useEffect(() => {
    if (type !== 'upgrade') {
      getRollBackList();
    }
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    visible ? getNewBackupDbStatus() : clearTimeout(timer);
  }, [visible]);

  const pollingRequest = () => {
    clearTimeout(timer);
    timer = setTimeout(getNewBackupDbStatus, 2000);
  };

  const getNewBackupDbStatus = async () => {
    const {
      data: { data, code, msg },
    } = await Service.getNewBackupDbStatus({
      cluster_id: clusterId,
      product_version: record?.product_version,
      product_name: record?.product_name,
    });
    if (code === 0) {
      setIsPending(data.backup_status === ROLLBACK_STATUS.PENDING);
      if (data.backup_status !== ROLLBACK_STATUS.PENDING) {
        setBackUpInfo(data);
        changePopboxInfo({
          ...visibleInfo,
          execId: data.exec_id,
        });
      } else {
        pollingRequest();
      }
    } else {
      message.error(msg);
    }
  };

  /**
   * 开始备份
   */
  async function handleBackUp() {
    setIsPending(true);
    const param = {
      cluster_id: clusterId,
      source_version: record?.product_version,
      target_version: form.getFieldValue('target_version'),
    };
    const res = await deployService.handleBackUp(
      {
        productName: record?.product_name,
      },
      param
    );
    if (res.data.code === 0) {
      const { data } = res.data;
      getNewBackupDbStatus();
      // 备份成功，保存备份信息到sessionStorage中,提供升级使用
      if (data.status !== 'running') {
        changePopboxInfo({ ...visibleInfo, execId: data?.exec_id || '' });
        if (type === 'upgrade' && data.status === 'success') {
          setHasNewBackup(true);
          sessionStorage.setItem(
            'product_backup_info',
            JSON.stringify({
              ...param,
              backup_name: data.backup_name,
              backup_sqls: data.backup_sqls,
            })
          );
        }
      }
    } else {
      message.error(res.data.msg);
    }
  }

  async function getRollBackList() {
    const { data } = await deployService.getRollBackList(
      { productName: record?.product_name },
      {
        cluster_id: clusterId,
        product_version: record?.product_version,
      }
    );
    if (data.code === 0) {
      setVersionList(data.data || []);
    }
  }

  async function getBackupTimes(target_version) {
    const { data } = await deployService.getBackupTimes(
      {
        productName: record?.product_name,
      },
      {
        cluster_id: clusterId,
        target_version,
      }
    );
    if (data.code === 0) {
      setBackUpList(data.data || []);
    }
  }

  const handleEvent = () => {
    changePopboxInfo((prevValue) => ({
      visible: !prevValue.visible,
      title: '日志查看',
      type: 'log',
      execId: prevValue.execId,
    }));
  };

  const refreshBackupInfo = () => {
    if (!hasNewBackup && backUpInfo.backup_status === ROLLBACK_STATUS.SUCCESS) {
      const info = {
        cluster_id: clusterId,
        source_version: backUpInfo.source_version,
        target_version: form.getFieldValue('target_version'),
        backup_name: backUpInfo.backup_time,
        backup_sqls: backUpInfo.backup_sqls,
      };
      sessionStorage.setItem('product_backup_info', JSON.stringify(info));
    }
  };

  // 进入部署向导
  function handleOk() {
    validateFields(async (err: any, values: any) => {
      if (!err) {
        let param = values.target_version;
        // 回滚时参数
        if (type === 'rollback') {
          param = {
            cluster_id: clusterId,
            source_version: record.product_version,
            target_version: values.target_version,
            backup_name: values.backup_name,
          };
          setLoading(true);
          const { data } = await deployService.handleRollBackCheck(
            {
              productName: record?.product_name,
            },
            param
          );
          if (data.code !== 0) {
            message.error(data.msg);
            setLoading(false);
            return;
          }
        }
        refreshBackupInfo();
        onOk(param);
      }
    });
  }

  const renderStatus = (status: string) => {
    switch (status) {
      case ROLLBACK_STATUS.SUCCESS:
        return (
          <span className="backupsuccess">
            <Icon type="check-circle" theme="filled" /> 备份成功{' '}
            <span>{backUpInfo.backup_time}</span>
          </span>
        );
      case ROLLBACK_STATUS.FAILED:
        return (
          <span className="backupfail">
            <Icon type="close-circle" theme="filled" /> 备份失败{' '}
            <a onClick={(e) => handleEvent()}>查看日志</a>
          </span>
        );
      default:
        return '-';
    }
  };

  const completeForm = () => {
    const { target_version, backup_name } = form.getFieldsValue();
    return type === 'upgrade'
      ? !!target_version
      : !!target_version && !!backup_name;
  };

  return (
    <>
      <Modal
        title={`组件${title}`}
        visible={visible}
        onCancel={onCancel}
        width={550}
        className="product-modal"
        footer={[
          <Button key="cancel" onClick={onCancel}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={handleOk}
            loading={loading}
            disabled={
              backUpInfo?.backup_status !== ROLLBACK_STATUS.SUCCESS ||
              isPending ||
              !completeForm()
            }>
            {title}
          </Button>,
        ]}>
        <Form {...formItemBaseLayout}>
          <Alert className="mb-20" type="info" showIcon message={tips} />
          <FormItem label="目标组件版本">
            {getFieldDecorator('target_version', {
              rules: [{ required: true, message: '请选择目标组件版本' }],
            })(
              <Select
                onChange={(e) => getBackupTimes(e)}
                placeholder="请选择目标组件版本">
                {type === 'upgrade'
                  ? options.map((item: any) => (
                      <Option key={item.id} value={item.product_version}>
                        {item.product_version}
                      </Option>
                    ))
                  : versions.map((item: any) => (
                      <Option key={item} value={item}>
                        {item}
                      </Option>
                    ))}
              </Select>
            )}
          </FormItem>
          {type !== 'upgrade' && (
            <FormItem label="备份库还原">
              {getFieldDecorator('backup_name', {
                rules: [{ required: true, message: '备份库缺失' }],
              })(
                <Select placeholder="请选择备份时间">
                  {backupList.map((item: any) => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Select>
              )}
            </FormItem>
          )}
          <FormItem label="备份当前库" style={{ marginBottom: 0 }}>
            <div className="flex">
              <Button
                type="primary"
                onClick={handleBackUp}
                disabled={isPending}>
                开始备份
              </Button>
              {isPending && (
                <div className="backuping">
                  <Icon type="reload" spin /> 备份中，请勿退出
                </div>
              )}
            </div>
            <p className="tips">
              近1h最新备份结果：{renderStatus(backUpInfo.backup_status)}
            </p>
          </FormItem>
        </Form>
      </Modal>
      {visibleInfo.visible && (
        <CommandPopbox
          {...visibleInfo}
          showFooter={false}
          onColse={handleEvent}
        />
      )}
    </>
  );
};

export default Form.create<IProps>()(UpgradeModal);
