import { Location } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { DishService } from '../services/dish.service';
import { Comment } from '../shared/comment';
import { Dish } from '../shared/dish';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
})
export class DishdetailComponent implements OnInit {
  @ViewChild('fForm')
  commentFormDirective!: { resetForm: () => void };
  commentForm!: FormGroup;
  comment!: Comment;
  errMess: any;

  formErrors: any = {
    author: '',
    comment: '',
  };

  validationMessages: any = {
    author: {
      required: 'Name is required.',
      minlength: 'Name must be at least 2 characters long.',
      maxlength: 'Name cannot be more than 25 characters long.',
    },
    comment: {
      required: 'Comment is required.',
      minlength: 'Comment must be at least 4 characters long.',
    },
  };
  constructor(
    private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject('baseURL') public baseURL: any
  ) {
    this.createForm();
  }

  dish!: Dish;
  dishIds!: string[];
  prev!: string;
  next!: string;
  dishcopy!: Dish;

  ngOnInit(): void {
    this.dishService
      .getDishIds()
      .subscribe((dishIds) => (this.dishIds = dishIds));
    this.route.params
      .pipe(
        switchMap((params: Params) => this.dishService.getDish(params['id']))
      )
      .subscribe((dish) => {
        this.dish = dish;
        this.dishcopy = dish;
        this.setPrevNext(dish.id);
      });
  }

  goBack(): void {
    this.location.back();
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev =
      this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next =
      this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }
  createForm() {
    this.commentForm = this.fb.group({
      author: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(25),
        ],
      ],
      rating: [5],
      comment: ['', [Validators.required, Validators.minLength(4)]],
    });
    this.commentForm.valueChanges.subscribe((data) =>
      this.onValueChanged(data)
    );

    this.route.params
      .pipe(
        switchMap((params: Params) => this.dishService.getDish(params['id']))
      )
      .subscribe(
        (dish) => {
          this.dish = dish;
          this.dishcopy = dish;
          this.setPrevNext(dish.id);
        },
        (errmess) => (this.errMess = <any>errmess)
      );

    this.onValueChanged(); // (re)set validation messages now
  }

  onSubmit() {
    const date = new Date();
    this.comment = this.commentForm.value;
    this.comment.date = date.toDateString();
    this.dish.comments.push(this.comment);
    this.commentForm.reset({
      author: '',
      comment: '',
      rating: 5,
    });
    this.dishService.putDish(this.dishcopy).subscribe(
      (dish) => {
        this.dish = dish;
        this.dishcopy = dish;
      },
      (errmess) => {
        // this.dish = null;
        // this.dishcopy = null;
        this.errMess = <any>errmess;
      }
    );
    this.commentFormDirective.resetForm();
    this.dishcopy.comments.push(this.comment);
  }
  onValueChanged(data?: any) {
    if (!this.commentForm) {
      return;
    }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ', ';
            }
          }
        }
      }
    }
  }
}
