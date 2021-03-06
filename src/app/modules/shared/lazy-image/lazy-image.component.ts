import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-lazy-image',
  templateUrl: './lazy-image.component.html',
  styleUrls: ['./lazy-image.component.scss']
})
export class LazyImageComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() lazySrc: string;
  @Input() view: 'card' | 'detail' | 'icon' = 'icon';
  @ViewChild('imgRef') imgRef: ElementRef;
  private visibilityConfig = {
    threshold: 0
  };
  public loading = false;
  constructor(private themeSvc: ThemeService) {

  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.lazySrc.previousValue && changes.lazySrc.previousValue !== changes.lazySrc.currentValue) {
      (this.imgRef && this.imgRef.nativeElement as HTMLImageElement).src = changes.lazySrc.currentValue;
    }
  }
  ngAfterViewInit(): void {
    const erroOb = fromEvent(this.imgRef.nativeElement, 'error');
    const loadOb = fromEvent(this.imgRef.nativeElement, 'load');
    loadOb.pipe(take(1)).subscribe(() => {
      this.loading = true;
    })
    erroOb.pipe(take(1)).subscribe(() => {
      (this.imgRef.nativeElement as HTMLImageElement).src = '../../../assets/imgs/img-404.svg';
    })
    if (this.themeSvc.isBrowser) {
      const observer = new IntersectionObserver((entries, self) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLImageElement).src = this.lazySrc;
            self.unobserve(entry.target);
          }
        });
      }, this.visibilityConfig);
      observer.observe(this.imgRef.nativeElement);
    }


  }

  ngOnInit() {
  }

}
