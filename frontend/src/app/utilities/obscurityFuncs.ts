import { Injectable } from '@angular/core';

@Injectable()
export class ObscurityFuncs {
    findRandomGenres(artist) {
        if (artist.genres.length > 1) {
            const random1 = Math.floor(Math.random() * artist.genres.length);
            let random2 = Math.floor(Math.random() * artist.genres.length);
            while (random1 === random2) {
                random2 = Math.floor(Math.random() * artist.genres.length);
            }
            const returnData = { randomGenre1 : artist.genres[random1], randomGenre2 : artist.genres[random2] };
            // check to see if these genres contain the word "christmas", if so remove it
            if (returnData.randomGenre1.indexOf('christmas') > -1) {
                returnData.randomGenre1 = returnData.randomGenre1.replace('christmas','');
            }
            if (returnData.randomGenre2.indexOf('christmas') > -1) {
                returnData.randomGenre2 = returnData.randomGenre2.replace('christmas','');
            }
            return returnData;
        } else if (artist.genres.length == 1) {
            return { randomGenre1 : artist.genres[0], randomGenre2 : null };
        } else {
            return { randomGenre1 : null, randomGenre2 : null };
        }
  }

  findStarRating(popularity) {

    switch (true) {
        case (popularity >= 90):
            return '★★★★★';
        case (popularity >= 80):
            return '★★★★';
        case (popularity >= 65):
            return '★★★';
        case (popularity >= 50):
            return '★★';
        case (popularity >= 35):
            return '★';
        default:
            return '';
      }
  }

  comparator(a, b) {
    if (a[1] > b[1]) { return -1; }
    if (a[1] < b[1]) { return 1; }
    return 0;
    }
}

export default ObscurityFuncs;
