/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  FormGroup,
  Label,
  LabelGroup,
  Radio,
  Select,
  SelectVariant,
  SelectOption,
  Spinner
} from '@patternfly/react-core';
import { global_spacer_sm } from '@patternfly/react-tokens';
import { IndexedStorage, CacheFeature, EncodingType, IndexedStartupMode } from "@services/infinispanRefData";
import { useTranslation } from 'react-i18next';
import { useCreateCache } from "@app/services/createCacheHook";
import { PopoverHelp } from "@app/Common/PopoverHelp";
import { FeatureCard } from "@app/Caches/Create/Features/FeatureCard";
import { TableErrorState } from '@app/Common/TableErrorState';
import { useFetchProtobufTypes } from '@app/services/protobufHook';
import { FeatureAlert } from "@app/Caches/Create/Features/FeatureAlert";

const IndexedCacheConfigurator = (props: {
  isEnabled: boolean
}) => {
  const { configuration, setConfiguration } = useCreateCache();
  const { t } = useTranslation();
  const brandname = t('brandname.brandname');

  const { protobufTypes, loading, error } = useFetchProtobufTypes()

  const [indexedStorage, setIndexedStorage] = useState<'filesystem' | 'local_heap'>(configuration.feature.indexedCache.indexedStorage);
  const [indexedEntities, setIndexedEntities] = useState<string[]>(configuration.feature.indexedCache.indexedEntities);
  const [validEntity, setValidEntity] = useState<'success' | 'error' | 'default'>('default');
  const [indexedStartupMode, setIndexedStartupMode] = useState<string>(configuration.feature.indexedCache.indexedStartupMode!);

  const [isOpenEntities, setIsOpenEntities] = useState(false)
  const [isOpenStartupMode, setIsOpenStartupMode] = useState(false)

  useEffect(() => {
    indexedEntities.length > 0 ? setValidEntity('success') : setValidEntity('error');

    setConfiguration((prevState) => {
      return {
        ...prevState,
        feature: {
          ...prevState.feature,
          indexedCache: {
            indexedStorage: indexedStorage,
            indexedStartupMode: indexedStartupMode,
            indexedEntities: indexedEntities,
            valid: indexingFeatureValidation()
          }
        }
      };
    });
  }, [indexedStorage, indexedEntities]);

  const indexingFeatureValidation = (): boolean => {
    return indexedEntities.length > 0;
  }

  const deleteChip = (chipToDelete: string) => {
    const newChips = indexedEntities.filter(chip => !Object.is(chip, chipToDelete));
    setIndexedEntities(newChips);
  };

  const onSelectSchemas = (event, selection, isPlaceholder) => {
    if (indexedEntities.includes(selection))
      setIndexedEntities(indexedEntities.filter(role => role !== selection));
    else
      setIndexedEntities([...indexedEntities, selection]);
  };

  const entitiesOptions = () => {
    return protobufTypes.map((schema, id) => (
      <SelectOption key={id} value={schema} />
    ))
  };

  const startupModeOptions = () => {
    return Object.keys(IndexedStartupMode).map((key) => (
      <SelectOption id={key} key={key} value={IndexedStartupMode[key]} />
    ));
  };

  const onSelectStartupMode = (event, selection, isPlaceholder) => {
    setIndexedStartupMode(selection);
    setIsOpenStartupMode(false);
  };

  const formSelectEntities = () => {
    if (loading) {
      return (
        <Card>
          <CardBody>
            <Spinner size="lg" />
          </CardBody>
        </Card>
      );
    }

    if (error) {
      return (
        <Card>
          <CardBody>
            <TableErrorState error={error} />
          </CardBody>
        </Card>
      );
    }

    return (
      <FormGroup
        isRequired
        label={t('caches.create.configurations.feature.index-storage-entity')}
        labelIcon={<PopoverHelp name={'index-storage-entity'}
          label={t('caches.create.configurations.feature.index-storage-entity')}
          content={t('caches.create.configurations.feature.index-storage-entity-tooltip', { brandname: brandname })} />}
        fieldId='indexed-entities'
        validated={validEntity}
        helperTextInvalid={t('caches.create.configurations.feature.index-storage-entity-helper')}>
        <Select
          placeholderText={"Select an entity"}
          variant={SelectVariant.checkbox}
          aria-label="entities-select"
          onToggle={() => setIsOpenEntities(!isOpenEntities)}
          onSelect={onSelectSchemas}
          selections={indexedEntities}
          isOpen={isOpenEntities}
          aria-labelledby="toggle-id-entities"
          toggleId="entitiesSelector"
          hasInlineFilter
          onClear={() => setIndexedEntities([])}
        >
          {entitiesOptions()}
        </Select>
      </FormGroup>
    )
  }

  if (!props.isEnabled) {
    return (
      <FeatureAlert feature={CacheFeature.INDEXED} error={t('caches.create.configurations.feature.indexed-types-disabled-description')} />
    )
  }

  if (configuration.basic.encoding !== EncodingType.Protobuf) {
    return (
      <FeatureAlert feature={CacheFeature.INDEXED} error={t('caches.create.configurations.feature.indexed-encoding-disabled-description', { encoding: configuration.basic.encoding })} />
    )
  }

  return (
    <FeatureCard title="caches.create.configurations.feature.indexed"
      description="caches.create.configurations.feature.indexed-tooltip">
      <FormGroup
        label={t('caches.create.configurations.feature.index-storage')}
        labelIcon={<PopoverHelp name={'indexed-storage'}
          label={t('caches.create.configurations.feature.index-storage')}
          content={t('caches.create.configurations.feature.index-storage-tooltip', { brandname: brandname })} />}
        fieldId='indexed-storage'
        isInline
      >
        <Radio
          name="radio-storage"
          id="persistent"
          onChange={() => setIndexedStorage(IndexedStorage.persistent)}
          isChecked={indexedStorage === IndexedStorage.persistent}
          label={t('caches.create.configurations.feature.index-storage-persistent')}
        />
        <Radio
          name="radio-storage"
          id="volatile"
          onChange={() => setIndexedStorage(IndexedStorage.volatile)}
          isChecked={indexedStorage === IndexedStorage.volatile}
          label={t('caches.create.configurations.feature.index-storage-volatile')}
        />
      </FormGroup>
      <FormGroup
        label={t('caches.create.configurations.feature.index-startup-mode')}
        labelIcon={<PopoverHelp name={'indexed-startup-mode'}
          label={t('caches.create.configurations.feature.index-startup-mode')}
          content={t('caches.create.configurations.feature.index-startup-mode-tooltip', { brandname: brandname })} />}
        fieldId='indexed-startup-mode'
        isInline
      >
        <Select
          variant={SelectVariant.single}
          aria-label="startup-mode-select"
          onToggle={() => setIsOpenStartupMode(!isOpenStartupMode)}
          onSelect={onSelectStartupMode}
          selections={indexedStartupMode}
          isOpen={isOpenStartupMode}
          aria-labelledby="toggle-id-startup-mode"
          placeholderText={t('caches.create.configurations.feature.index-startup-mode-placeholder')}
        >
          {startupModeOptions()}
        </Select>
      </FormGroup>
      {formSelectEntities()}
      <LabelGroup>
        {indexedEntities.map(currentChip => (
          <Label data-cy={currentChip}
            color="blue"
            closeBtnAriaLabel="Remove entity"
            style={{ marginRight: global_spacer_sm.value }}
            key={currentChip} onClose={() => deleteChip(currentChip)}>
            {currentChip}
          </Label>
        ))}
      </LabelGroup>
    </FeatureCard>
  );
};

export default IndexedCacheConfigurator;
