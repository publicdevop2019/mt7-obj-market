import { Location } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { onCategoriesPageHeader, onHomeHeader, onSearchHeader } from 'src/app/classes/utility';
@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
    public onCategoriesPage: boolean;
    public onHomePage: boolean;
    public onSearchPage: boolean;
    @Output() filterClick = new EventEmitter<void>();
    constructor(
        public activatedRoute: ActivatedRoute,
        public router: Router,
        private location: Location
    ) {
        (router.events.pipe(
            filter(evt => evt instanceof NavigationEnd)
        ) as Observable<NavigationEnd>).subscribe(next => {
            this.onCategoriesPage = onCategoriesPageHeader();
            this.onHomePage = onHomeHeader();
            this.onSearchPage = onSearchHeader();
        });
    }

    ngOnInit() { }
    navBack() {
        this.location.back();
    }
    public emitEvent() {
        this.filterClick.emit();
    }
}
