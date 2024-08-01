import { Component, inject, Input, OnInit } from '@angular/core';
import { DataService, YourStocks } from '../data.service';
import { map, Observable, shareReplay } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css',
})
export class StockComponent implements OnInit {
  dataServis = inject(DataService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  @Input() stock: YourStocks;
  @Input() yourStocks: YourStocks[];

  data$: Observable<any>;

  yourStockss: YourStocks[] = [];
  wishlistBtn: boolean;
  sellBtn: boolean;
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
  hideBtn() {
    if (this.route.snapshot.params.ID) {
      this.wishlistBtn = true;
      this.sellBtn = false;
    } else {
      this.wishlistBtn = false;
      this.sellBtn = true;
    }
  }
  onBuy(
    amount: number,
    name: string,
    symbol: string,
    price: number,
    wishlist: boolean
  ) {
    let yourStock: YourStocks;

    // Dobavljanje trenutne cene

    const oldBalance = this.balance$.getValue();
    const newBalance = oldBalance - price * amount;

    if (newBalance < 0) {
      alert('Insufficient funds.');
      return; // Prekini lanac ako nema dovoljno sredstava
    }

    // Ažuriranje balansa
    this.balance$.next(newBalance);
    let stockss: YourStocks[];
    this.dataServis.yourStocks$.pipe(
      map((stocks) => {
        stockss = stocks;
      })
    );
    // Kreiranje objekta za kupovinu akcija
    yourStock = {
      name,
      amount,
      symbol,
      price,
      totalCost: +price * amount,
      wishlist,
      description: null,
      // currentValue: price * amount,
    };

    // Emitovanje novih akcija

    const existingStockIndex = stockss.findIndex(
      (stock) => stock.symbol === yourStock.symbol
    );

    if (existingStockIndex !== -1) {
      // Ako već postoji, povećaj količinu
      stockss[existingStockIndex].amount += amount;
      stockss[existingStockIndex].totalCost += amount * +price;
    } else {
      // Inače, dodaj novu akciju
    }
    stockss.push(this.stock);
    this.dataServis.yourStocks$.next(this.yourStockss);
  }
  ngOnInit(): void {
    this.getCurentValue();
    this.hideBtn();
    console.log(this.route.snapshot);

    console.log(this.yourStockss);
  }
}
