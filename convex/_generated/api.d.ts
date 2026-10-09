/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as capabilityRatings from "../capabilityRatings.js";
import type * as classSeries from "../classSeries.js";
import type * as learningGoals from "../learningGoals.js";
import type * as learningProfileDashboard from "../learningProfileDashboard.js";
import type * as learningProfiles from "../learningProfiles.js";
import type * as legacyReviews from "../legacyReviews.js";
import type * as platformFoundation from "../platformFoundation.js";
import type * as reviews from "../reviews.js";
import type * as sportConfig from "../sportConfig.js";
import type * as stage2Students from "../stage2Students.js";
import type * as studentFoundation from "../studentFoundation.js";
import type * as students from "../students.js";
import type * as tennisCutover from "../tennisCutover.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  capabilityRatings: typeof capabilityRatings;
  classSeries: typeof classSeries;
  learningGoals: typeof learningGoals;
  learningProfileDashboard: typeof learningProfileDashboard;
  learningProfiles: typeof learningProfiles;
  legacyReviews: typeof legacyReviews;
  platformFoundation: typeof platformFoundation;
  reviews: typeof reviews;
  sportConfig: typeof sportConfig;
  stage2Students: typeof stage2Students;
  studentFoundation: typeof studentFoundation;
  students: typeof students;
  tennisCutover: typeof tennisCutover;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
