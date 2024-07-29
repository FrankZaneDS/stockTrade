import { Component, inject, Input, OnInit } from '@angular/core';
import { DataService, YourStocks } from '../data.service';
import { map, Observable, shareReplay } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css',
})
export class StockComponent implements OnInit {
  dataServis = inject(DataService);
  @Input() stock: YourStocks;
  @Input() yourStocks: YourStocks[];

  data$: Observable<any>;

  balance$ = this.dataServis.balance$;
  curentValue$: Observable<number>;
  curentPrice$: Observable<number>;
  amount: number = 1;
  getCurentValue() {
    const params = {
      symbol: this.stock.symbol,
      token: this.dataServis.pinhubApi,
    };
    this.data$ = this.dataServis
      .getCurrentPrice(params)
      .pipe(shareReplay({ refCount: true }));
    this.curentPrice$ = this.data$.pipe(
      map((price) => {
        return +price.c;
      })
    );

    this.curentValue$ = this.data$.pipe(
      map((price) => {
        const curentValue = +price.c * this.stock.amount;
        return curentValue;
      })
    );
  }
  onSellBtn(stock: YourStocks, price) {
    const oldBalance = this.balance$.getValue();
    const newBalance = oldBalance + price * this.amount;
    this.balance$.next(newBalance);
    const existingStockIndex = this.yourStocks.findIndex(
      (s) => s.symbol === stock.symbol
    );

    if (this.yourStocks[existingStockIndex].amount > this.amount) {
      this.yourStocks[existingStockIndex].amount -= this.amount;
      console.log(price);
    } else {
      this.yourStocks.splice(existingStockIndex, 1);
      console.log('sdfsd');
    }

    this.dataServis.yourStocks$.next(this.yourStocks);
    this.getCurentValue();
    console.log(this.yourStocks);
  }
  ngOnInit(): void {
    this.getCurentValue();
  }
}
