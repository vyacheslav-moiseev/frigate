import { TestBed } from '@angular/core/testing';

import { InspectionApi } from './inspection-api';

describe('InspectionApi', () => {
  let service: InspectionApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InspectionApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
