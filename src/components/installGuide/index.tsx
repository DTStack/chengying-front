import * as React from 'react';
import { Modal, Button } from 'antd';
import utils from '@/utils/utils';
const packageInfo = require('../../../package.json');

export interface IProps {
  history?: any;
  visible: boolean;
  onClose: () => void;
}

const InstallGuideModal: React.FC<IProps> = (props) => {
  const { visible, onClose } = props;

  React.useEffect(() => {}, []);

  const jumpGuidePath = () => {
    let path = '/deploycenter/appmanage/installs';
    utils.setNaviKey('menu_deploy_center', 'sub_menu_product_deploy');
    props.history.push(path);
    onClose();
  };

  const jumpSelectHost = () => {
    let path = '/deploycenter/cluster/list';
    utils.setNaviKey('menu_deploy_center', 'sub_menu_cluster_manage');
    props.history.push(path);
    onClose();
  };

  return (
    <Modal
      className="installGuideModal"
      title="部署向导"
      onCancel={onClose}
      visible={visible}
      width={520}
      footer={
        <Button type="primary" onClick={jumpGuidePath}>
          开始部署
        </Button>
      }>
      <div>
        <p>
          欢迎适应EasyManager产品部署管家！ <span>({packageInfo.version})</span>
        </p>
        <div>
          若需要对已部署组件进行 “升级” 或 “回滚” 等管理操作，请前往{' '}
          <span onClick={jumpSelectHost}>部署中心</span>选择集群 &rarr;
          已部署组件。
        </div>
      </div>
    </Modal>
  );
};

export default InstallGuideModal;
