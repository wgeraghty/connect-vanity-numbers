import { HttpClient } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { catchError, first } from 'rxjs/operators'
import Swal from 'sweetalert2'

interface VanityNumber {
  phoneNumber: string
  vanityNumbers: string[]
  modified: string
}

@Component({
  selector: 'app-vanity',
  templateUrl: './vanity.component.html',
  styleUrls: ['./vanity.component.scss']
})
export class VanityComponent implements OnInit {

  endpoint: string
  vanityNumbers: VanityNumber[]

  columnsToDisplay = [
    'phoneNumber',
    'vanityNumbers',
    'modified'
  ]

  constructor(private http: HttpClient) {
    this.endpoint = ''
    this.vanityNumbers = []
  }

  ngOnInit(): void {
  }

  handleError(): void {

  }

  refresh(): void {
    if (!this.endpoint.length) {
      Swal.fire('Error', 'Endpoint Missing')
      return
    }

    this.http.get<VanityNumber[]>(this.endpoint)
      .pipe(
        catchError(error => {
          console.log(error.message)
          Swal.fire('Error', error.message)
          throw new Error(error.message)
        }),
        first()
      )
      .subscribe((data: VanityNumber[]) => {
        this.vanityNumbers = data
      })
  }

}
