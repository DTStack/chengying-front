import * as React from 'react';
import { Input, Form, Tooltip, Icon, Col, Row } from 'antd';
import '../style.scss';

const FormItem = Form.Item;

class Step1SetModal extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
  }

  render() {
    const { data } = this.props;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 18 },
      },
    };
    console.log(data);
    return (
      <Form className="step-set-modal">
        <FormItem {...formItemLayout} label="产品包名称">
          {getFieldDecorator('ProductName', {
            initialValue: data.ProductName,
          })(<span>{data.ProductName}</span>)}
        </FormItem>
        <FormItem {...formItemLayout} label="产品版本号">
          {getFieldDecorator('ProductVersion', {
            initialValue: data.ProductVersion,
          })(<span>{data.ProductVersion}</span>)}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="应用启动用户名"
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
          // required
        >
          {getFieldDecorator('field', {
            rules: [
              // { required: true, message: '' }
            ],
            initialValue: '',
          })(
            <Input
              placeholder="请输入应用启动用户名"
              style={{
                width: '320px',
              }}
            />
          )}
          <Tooltip
            title={
              '应用启动用户名，将初始化进产品包的各服务中， 即产品包下各服务部署时，默认以此用户名启动。同时，各服务也支持使用不同的启动用户名， 故实际部署以最终细粒度的服务启动用户名为准。'
            }>
            <Icon
              type="info-circle-o"
              style={{
                fontSize: '16px',
                marginLeft: '10px',
              }}
            />
          </Tooltip>
        </FormItem>
        <Row
          style={{
            color: 'rgb(151,151,151)',
          }}>
          <Col span={6} />
          <Col span={18}>仅以root用户接入主机时，该设置有效。</Col>
        </Row>
      </Form>
    );
  }
}
export default Form.create<any>()(Step1SetModal);
