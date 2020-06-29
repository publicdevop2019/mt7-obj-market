import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { notNullAndUndefinedAndEmptyString } from 'src/app/classes/utility';
import { ProductService } from 'src/app/services/product.service';
import { IProductDetail, IProductSku } from '../../pages/product-detail/product-detail.component';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
interface ISaleAttrUI {
    name: string;
    value: string[];
}
@Component({
    selector: 'app-product-basic',
    templateUrl: './product-basic.component.html',
    styleUrls: ['./product-basic.component.scss']
})
export class ProductBasicComponent implements OnInit, OnDestroy {
    @Input() productDetail: IProductDetail;
    public imageUrlPrefix: string = environment.imageUrl + '/'
    public salesAttr: ISaleAttrUI[] = [];
    private basePrice: number;
    constructor(public productSvc: ProductService) { }
    ngOnDestroy(): void {
        this.subs.forEach(sub => {
            sub && sub.unsubscribe();
        })
    }
    ngOnInit() {
        const optionCtrls: any = {};
        if (this.productDetail.selectedOptions)
            this.productDetail.selectedOptions.forEach(e => {
                optionCtrls[e.title] = new FormControl('', []);
            });
        this.productSvc.formProductOption = new FormGroup(optionCtrls);
        this.productSvc.finalPrice = +this.productDetail.lowestPrice;
        this.productSvc.formProductOption.valueChanges.subscribe(next => {
            this.productSvc.finalPrice = this.calcTotal();
        });
        this.extracSalesInfo(this.productDetail.skus);
        this.productSvc.formProductSalesAttr.valueChanges.subscribe(next => {
            if (Object.keys(next).filter(e => next[e] === '').length === 0) {
                this.updateBasePrice(next);
                this.productSvc.finalPrice = this.calcTotal();
            }
        });
        this.basePrice = +this.productDetail.lowestPrice;
        this.dynamicUpdateAttrCtrlStatus();

    }
    private subs: Subscription[] = []
    dynamicUpdateAttrCtrlStatus() {
        this.subs.push(...Object.keys(this.productSvc.formProductSalesAttr.controls).map(ctrl => {
            return this.productSvc.formProductSalesAttr.get(ctrl).valueChanges.subscribe(
                next => {
                    this.updateAttrCtrl(ctrl, next)
                }
            )
        }))
    }
    public disableList: string[] = [];
    updateAttrCtrl(ctrlName: string, next: string) {
        //find matching sku(s)
        if (next) {
            let fg = this.productSvc.formProductSalesAttr
            let salesAttr = Object.keys(fg.value).filter(e => (fg.get(e).value !== '' && fg.get(e).value !== null)).map(e => e + ':' + fg.get(e).value);
            let avaliableSku = this.productDetail.skus.filter(e => this.hasAllSalesAttr(e, salesAttr));
            let var1 = avaliableSku.map(e => e.attributeSales.filter(e => !e.includes(ctrlName)));
            let flat: string[] = [];
            var1.forEach(e => flat.push(...e));
            let newDisableList: string[] = [...this.disableList.filter(e => e.includes(ctrlName))]
            this.salesAttr.filter(e => e.name !== ctrlName).forEach(
                e => {
                    e.value.forEach(
                        ee => {
                            if (!flat.includes(e.name + ':' + ee)) {
                                newDisableList.push(e.name + ee)
                            }
                        }
                    )
                }
            )
            this.disableList = newDisableList;
        }
    }
    resetSalesForm() {
        this.productSvc.formProductSalesAttr.reset({}, { onlySelf: true });
        this.disableList = [];
    }
    hasAllSalesAttr(e: IProductSku, salesAttr: string[]): boolean {
        return salesAttr.filter(attr => e.attributeSales.includes(attr)).length === salesAttr.length
    }
    extracSalesInfo(skus: IProductSku[]) {
        skus.forEach(sku => {
            sku.attributeSales.forEach(e => {
                let name = e.split(':')[0];
                let value = e.split(':')[1];
                let var2 = this.salesAttr.filter(e => e.name === name);
                if (var2.length > 0) {
                    if (var2[0].value.includes(value)) {
                        // do nothing for same value
                    } else {
                        var2[0].value.push(value);
                    }
                } else {
                    let var1 = <ISaleAttrUI>{
                        name: name,
                        value: [value]
                    }
                    this.salesAttr.push(var1)
                }
            })
        });
        const salesCtrls: any = {};
        if (this.salesAttr.length > 0)
            this.salesAttr.forEach(e => {
                salesCtrls[e.name] = new FormControl('', []);
            });
        this.productSvc.formProductSalesAttr = new FormGroup(salesCtrls);
    }

    calcTotal(): number {
        let vars = 0;
        let qty = 1;
        Object.keys(this.productSvc.formProductOption.controls).filter(e => e !== 'salesAttr').forEach(title => {
            if (
                notNullAndUndefinedAndEmptyString(
                    this.productSvc.formProductOption.get(title).value
                )
            ) {
                const var1: string = this.productDetail.selectedOptions
                    .filter(e => e.title === title)[0]
                    .options.filter(
                        e =>
                            e.optionValue ===
                            this.productSvc.formProductOption.get(title).value
                    )[0].priceVar;
                if (var1.indexOf('+') > -1) {
                    vars = vars + +var1.replace('+', '');
                } else if (var1.indexOf('-') > -1) {
                    vars = vars - +var1.replace('-', '');
                } else if (var1.indexOf('x') > -1) {
                    qty = +var1.replace('x', '');
                } else {
                    throw new Error(
                        "unrecognized operator, should be one of '-', '+', 'x'"
                    );
                }
            }
        });
        return +((+this.basePrice + vars) * qty).toFixed(2);
    }
    updateBasePrice(sales: any) {
        let salesAttr = Object.keys(sales).map(key => key + ":" + sales[key]).sort().join(',');
        let out = this.productDetail.skus.filter(e => e.attributeSales.sort().join(',') === salesAttr)[0];
        if (out)
            this.basePrice = out.price
    }
}
