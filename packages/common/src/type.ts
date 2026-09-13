import type { CATEGORY_COLOR_CODE, CATEGORY_ICON_CODE } from './db-constants';
import type { CATEGORY_TYPE_VALUE } from './ui-constant';

export type CategoryTypeValue = (typeof CATEGORY_TYPE_VALUE)[keyof typeof CATEGORY_TYPE_VALUE];

export type CategoryIconCode = (typeof CATEGORY_ICON_CODE)[keyof typeof CATEGORY_ICON_CODE];

export type CategoryColorCode = (typeof CATEGORY_COLOR_CODE)[keyof typeof CATEGORY_COLOR_CODE];
