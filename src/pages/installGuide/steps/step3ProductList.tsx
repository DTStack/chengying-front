import * as React from 'react';
import '../style.scss';
interface Prop {
    productServicesInfo: any;
}
interface State {
    productNameFilter: string;
}
class StepThreeProductList extends React.Component<Prop, State> {
    state: State = {
        productNameFilter: ''
    }
    handleProdutNameFilter = (filter) => {
        const { deployState, runtimeState } = this.props;
        if (!alertModal(runtimeState, deployState)) return;
        const { productServicesInfo } = this.props;
        const selectedProduct = productServicesInfo.find(
          (product) => product.productName === filter
        );
        const nextOpenKeys = this.getAllOpenKeys(selectedProduct.content);
        this.setState(
          {
            productNameFilter: filter,
            openKeys: nextOpenKeys,
          },
          () => {
            this.props.saveInstallInfo({
              ProductName: selectedProduct.productName,
              ProductVersion: selectedProduct.version,
            });
            this.props.setSelectedConfigService({});
          }
        );
      };
    render() {
        const { productServicesInfo } = this.props;
        const { productNameFilter } = this.state;
        return (
           <div className='stepThreeProductList'>
               <div className='stepThreeProductListTop'>组件</div>
               {Array.isArray(productServicesInfo) && (
                   {productServicesInfo?.map((item: any) => (
                    <div 
                        onClick={() => {this.handleProdutNameFilter(item)}}
                        className={item.productName == productNameFilter ? 'stepThreeListItem activeItem' : 'stepThreeListItem'}
                        key={item.productName} 
                       > {item.productName} {item.version}</div>
                   ))}
               )}
           </div> 
        )
    }
}
export default StepThreeProductList;