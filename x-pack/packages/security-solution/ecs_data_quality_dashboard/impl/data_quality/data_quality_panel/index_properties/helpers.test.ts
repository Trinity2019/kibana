/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EcsFlat } from '@elastic/ecs';

import {
  getMappingsProperties,
  getSortedPartitionedFieldMetadata,
  hasAllDataFetchingCompleted,
} from './helpers';
import { mockIndicesGetMappingIndexMappingRecords } from '../../mock/indices_get_mapping_index_mapping_record/mock_indices_get_mapping_index_mapping_record';
import { mockMappingsProperties } from '../../mock/mappings_properties/mock_mappings_properties';
import { EcsMetadata } from '../../types';

const ecsMetadata: Record<string, EcsMetadata> = EcsFlat as unknown as Record<string, EcsMetadata>;

describe('helpers', () => {
  describe('getSortedPartitionedFieldMetadata', () => {
    test('it returns null when mappings are loading', () => {
      expect(
        getSortedPartitionedFieldMetadata({
          ecsMetadata,
          loadingMappings: true, // <--
          mappingsProperties: mockMappingsProperties,
          unallowedValues: {},
        })
      ).toBeNull();
    });

    test('it returns null when `ecsMetadata` is null', () => {
      expect(
        getSortedPartitionedFieldMetadata({
          ecsMetadata: null, // <--
          loadingMappings: false,
          mappingsProperties: mockMappingsProperties,
          unallowedValues: {},
        })
      ).toBeNull();
    });

    test('it returns null when `unallowedValues` is null', () => {
      expect(
        getSortedPartitionedFieldMetadata({
          ecsMetadata,
          loadingMappings: false,
          mappingsProperties: mockMappingsProperties,
          unallowedValues: null, // <--
        })
      ).toBeNull();
    });

    describe('when `mappingsProperties` is unknown', () => {
      const expected = {
        all: [],
        custom: [],
        ecsCompliant: [],
        incompatible: [
          {
            description:
              'Date/time when the event originated. This is the date/time extracted from the event, typically representing when the event was generated by the source. If the event source has no original timestamp, this value is typically populated by the first time the event was received by the pipeline. Required field for all events.',
            hasEcsMetadata: true,
            indexFieldName: '@timestamp',
            indexFieldType: '-',
            indexInvalidValues: [],
            isEcsCompliant: false,
            isInSameFamily: false,
            type: 'date',
          },
        ],
        sameFamily: [],
      };

      test('it returns a `PartitionedFieldMetadata` with an `incompatible` `@timestamp` when  `mappingsProperties` is undefined', () => {
        expect(
          getSortedPartitionedFieldMetadata({
            ecsMetadata,
            loadingMappings: false,
            mappingsProperties: undefined, // <--
            unallowedValues: {},
          })
        ).toEqual(expected);
      });

      test('it returns a `PartitionedFieldMetadata` with an `incompatible` `@timestamp` when  `mappingsProperties` is null', () => {
        expect(
          getSortedPartitionedFieldMetadata({
            ecsMetadata,
            loadingMappings: false,
            mappingsProperties: null, // <--
            unallowedValues: {},
          })
        ).toEqual(expected);
      });
    });

    test('it returns the expected sorted field metadata', () => {
      const unallowedValues = {
        'event.category': [
          {
            count: 2,
            fieldName: 'an_invalid_category',
          },
          {
            count: 1,
            fieldName: 'theory',
          },
        ],
        'event.kind': [],
        'event.outcome': [],
        'event.type': [],
      };

      expect(
        getSortedPartitionedFieldMetadata({
          ecsMetadata,
          loadingMappings: false,
          mappingsProperties: mockMappingsProperties,
          unallowedValues,
        })
      ).toMatchObject({
        all: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            flat_name: expect.any(String),
            dashed_name: expect.any(String),
            description: expect.any(String),
            hasEcsMetadata: true,
            isEcsCompliant: expect.any(Boolean),
            isInSameFamily: expect.any(Boolean),
          }),
        ]),
        ecsCompliant: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            flat_name: expect.any(String),
            dashed_name: expect.any(String),
            description: expect.any(String),
            hasEcsMetadata: true,
            isEcsCompliant: true,
            isInSameFamily: false,
          }),
        ]),
        custom: expect.arrayContaining([
          expect.objectContaining({
            indexFieldName: expect.any(String),
            indexFieldType: expect.any(String),
            indexInvalidValues: expect.any(Array),
            hasEcsMetadata: expect.any(Boolean),
            isEcsCompliant: expect.any(Boolean),
            isInSameFamily: expect.any(Boolean),
          }),
        ]),
        incompatible: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            flat_name: expect.any(String),
            dashed_name: expect.any(String),
            description: expect.any(String),
            hasEcsMetadata: expect.any(Boolean),
            isEcsCompliant: false,
            isInSameFamily: false,
          }),
        ]),
        sameFamily: [],
      });
    });
  });

  describe('getMappingsProperties', () => {
    test('it returns the expected mapping properties', () => {
      expect(
        getMappingsProperties({
          indexes: mockIndicesGetMappingIndexMappingRecords,
          indexName: 'auditbeat-custom-index-1',
        })
      ).toEqual({
        '@timestamp': {
          type: 'date',
        },
        event: {
          properties: {
            category: {
              ignore_above: 1024,
              type: 'keyword',
            },
          },
        },
        host: {
          properties: {
            name: {
              fields: {
                keyword: {
                  ignore_above: 256,
                  type: 'keyword',
                },
              },
              type: 'text',
            },
          },
        },
        some: {
          properties: {
            field: {
              fields: {
                keyword: {
                  ignore_above: 256,
                  type: 'keyword',
                },
              },
              type: 'text',
            },
          },
        },
        source: {
          properties: {
            ip: {
              fields: {
                keyword: {
                  ignore_above: 256,
                  type: 'keyword',
                },
              },
              type: 'text',
            },
            port: {
              type: 'long',
            },
          },
        },
      });
    });

    test('it returns null when `indexes` is null', () => {
      expect(
        getMappingsProperties({
          indexes: null, // <--
          indexName: 'auditbeat-custom-index-1',
        })
      ).toBeNull();
    });

    test('it returns null when `indexName` does not exist in `indexes`', () => {
      expect(
        getMappingsProperties({
          indexes: mockIndicesGetMappingIndexMappingRecords,
          indexName: 'does-not-exist', // <--
        })
      ).toBeNull();
    });

    test('it returns null when `properties` does not exist in the mappings', () => {
      const missingProperties = {
        ...mockIndicesGetMappingIndexMappingRecords,
        foozle: {
          mappings: {}, // <-- does not have a `properties`
        },
      };

      expect(
        getMappingsProperties({
          indexes: missingProperties,
          indexName: 'foozle',
        })
      ).toBeNull();
    });
  });

  describe('hasAllDataFetchingCompleted', () => {
    test('it returns false when both the mappings and unallowed values are loading', () => {
      expect(
        hasAllDataFetchingCompleted({
          loadingMappings: true,
          loadingUnallowedValues: true,
        })
      ).toBe(false);
    });

    test('it returns false when mappings are loading, and unallowed values are NOT loading', () => {
      expect(
        hasAllDataFetchingCompleted({
          loadingMappings: true,
          loadingUnallowedValues: false,
        })
      ).toBe(false);
    });

    test('it returns false when mappings are NOT loading, and unallowed values are loading', () => {
      expect(
        hasAllDataFetchingCompleted({
          loadingMappings: false,
          loadingUnallowedValues: true,
        })
      ).toBe(false);
    });

    test('it returns true when both the mappings and unallowed values have finished loading', () => {
      expect(
        hasAllDataFetchingCompleted({
          loadingMappings: false,
          loadingUnallowedValues: false,
        })
      ).toBe(true);
    });
  });
});
