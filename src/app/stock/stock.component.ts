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
  dataService = inject(DataService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  @Input() stock: YourStocks;
  @Input() yourStocks: YourStocks[];
  @Input() index: number;

  yourStocks$ = this.dataService.yourStocks$;
  data$: Observable<any>;

  wishlistBtn: boolean;
  sellBtn: boolean;
  balance$ = this.dataService.balance$;
  curentValue$: Observable<number>;
  curentPrice$: Observable<number>;
  amount: number = 1;
  getCurentValue() {
    const params = {
      symbol: this.stock.symbol,
      token: this.dataService.pinhubApi,
    };
    this.data$ = this.dataService
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

    this.dataService.yourStocks$.next(this.yourStocks);
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
  onRemoveBtn(index) {
    const wishlist = this.dataService.wishlist$.getValue();
    wishlist.splice(index, 1);
    this.dataService.wishlist$.next(wishlist);
  }
  onBuy(
    amount: number,
    name: string,
    ticker: string,
    price: number,
    wishlist: boolean,
    yourStocks: YourStocks[]
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

    // Kreiranje objekta za kupovinu akcija
    yourStock = {
      name,
      amount,
      symbol: ticker,
      price,
      totalCost: price * amount,
      wishlist: false,
      description: null,
      // currentValue: price * amount,
    };

    // Emitovanje novih akcija

    const existingStockIndex = yourStocks.findIndex(
      (stock) => stock.symbol === yourStock.symbol
    );

    if (existingStockIndex !== -1) {
      // Ako već postoji, povećaj količinu
      yourStocks[existingStockIndex].amount += amount;
      yourStocks[existingStockIndex].totalCost += amount * price;
    } else {
      // Inače, dodaj novu akciju
      yourStocks.push(yourStock);
    }

    this.dataService.yourStocks$.next(yourStocks);
  }

  ngOnInit(): void {
    this.getCurentValue();
    this.hideBtn();
    console.log(this.route.snapshot);
  }
}
