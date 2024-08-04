import { Component, inject, Input, OnInit } from '@angular/core';
import { DataService, YourStocks } from '../data.service';
import { map, Observable, shareReplay } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  buy: boolean = false;
  notEnough: boolean = false;
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
  onSellBtn(stock: YourStocks, price: number) {
    const oldBalance = this.balance$.getValue();

    const existingStockIndex = this.yourStocks.findIndex(
      (s) => s.symbol === stock.symbol
    );

    if (this.yourStocks[existingStockIndex].amount > this.amount) {
      this.yourStocks[existingStockIndex].amount -= this.amount;
      const newBalance = oldBalance + price * this.amount;
      this.balance$.next(newBalance);
      console.log(price);
    } else if (this.yourStocks[existingStockIndex].amount < this.amount) {
      return;
    } else {
      this.yourStocks.splice(existingStockIndex, 1);
      console.log('sdfsd');
      const newBalance = oldBalance + price * this.amount;
      this.balance$.next(newBalance);
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
    name: string,
    ticker: string,
    price: number,
    wishlist,
    yourStocks: YourStocks[]
  ) {
    let yourStock: YourStocks;

    // Dobavljanje trenutne cene

    const oldBalance = this.balance$.getValue();
    const newBalance = oldBalance - price * this.amount;

    if (newBalance < 0) {
      console.log('Insufficient funds.');
      this.notEnough = true;
      setTimeout(() => {
        this.notEnough = false;
      }, 2000);

      return; // Prekini lanac ako nema dovoljno sredstava
    }

    // Ažuriranje balansa
    this.balance$.next(newBalance);

    // Kreiranje objekta za kupovinu akcija
    yourStock = {
      name,
      amount: this.amount,
      symbol: ticker,
      price,
      totalCost: price * this.amount,
      wishlist,
      description: null,
      // currentValue: price * amount,
    };

    // Emitovanje novih akcija

    const existingStockIndex = yourStocks.findIndex(
      (stock) => stock.symbol === yourStock.symbol
    );

    if (existingStockIndex !== -1) {
      // Ako već postoji, povećaj količinu
      yourStocks[existingStockIndex].amount += this.amount;
      yourStocks[existingStockIndex].totalCost += this.amount * price;
    } else {
      // Inače, dodaj novu akciju
      yourStocks.push(yourStock);
    }

    this.buy = true;
    setTimeout(() => {
      this.buy = false;
    }, 2000);

    this.dataService.yourStocks$.next(yourStocks);
    this.amount = 1;
  }

  ngOnInit(): void {
    this.getCurentValue();
    this.hideBtn();
    console.log(this.route.snapshot);
  }
}
