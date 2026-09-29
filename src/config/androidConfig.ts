/**
 * Android Release Identity, AAB Build & Google Play Readiness Configuration
 * Centralized, non-hardcoded configuration for packaging Social Share Scheduler as an Android application.
 *
 * IMPORTANT:
 * - Once published on Google Play, `appId` / `applicationId` MUST remain permanently stable.
 * - `versionCode` must be a strictly incrementing positive integer on every Google Play upload.
 * - Production signing credentials (`.jks` / `.keystore`, keystore passwords, key aliases)
 *   must NEVER be committed to source control or exposed in frontend code.
 */

export type ReadinessCategory = 'READY' | 'NOT_READY' | 'REQUIRES_CONFIGURATION';

export interface ReadinessCheckItem {
  id: string;
  label: string;
  status: ReadinessCategory;
  detail: string;
}

export interface AndroidAppConfig {
  // 1. Package Identity
  appId: string;
  applicationId: string;
  namespace: string;
  appName: string;
  recommendedProductionAppId: string;
  packageIdLockedForPlayStore: boolean;

  // 2. Release Versioning
  versionName: string;
  versionCode: number;

  // 3. SDK & Gradle Target Configuration
  compileSdkVersion: number;
  minSdkVersion: number;
  targetSdkVersion: number;
  recommendedGradleVersion: string;
  recommendedAgpVersion: string;
  javaTargetCompatibility: string;

  // 4. Capacitor & Web Sync Architecture
  webBuildOutputDir: string;
  capacitorConfigPath: string;
  nativeAndroidProjectGenerated: boolean;

  // 5. Release Build & Signing Configuration
  releaseFormat: 'AAB';
  gradleBundleTask: string;
  gradleAssembleReleaseTask: string;
  productionSigningConfigured: boolean;
  signingMethod: 'UNCONFIGURED_EXTERNAL_KEYSTORE_REQUIRED';

  // 6. Google Play Billing Placeholders (NOT real Play Console SKUs yet)
  googlePlayBillingPlaceholders: {
    PRO_MONTHLY: string;
    PRO_YEARLY: string;
    isPlaceholderOnly: true;
    billingLibraryDependency: string;
    billingPermission: string;
  };

  // 7. Theme & Manifest Metadata
  themeColor: string;
  backgroundColor: string;
  permissions: {
    required: string[];
    forbidden: string[];
  };
  nativeFeatures: {
    localNotifications: 'requires_native' | 'ready';
    shareTarget: 'requires_native' | 'ready';
    mediaFilesystem: 'requires_native' | 'ready';
    persistentStorage: 'local_storage' | 'sqlite' | 'preferences';
  };
}

export const ANDROID_CONFIG: AndroidAppConfig = {
  // 1. Package Identity (preserved as currently configured)
  appId: 'com.socialsharescheduler.app',
  applicationId: 'com.socialsharescheduler.app',
  namespace: 'com.socialsharescheduler.app',
  appName: 'Social Share Scheduler',
  recommendedProductionAppId: 'com.socialsharescheduler.app',
  packageIdLockedForPlayStore: false,

  // 2. Release Versioning (human-readable versionName + incrementing integer versionCode)
  versionName: '1.0.0',
  versionCode: 1,

  // 3. SDK & Gradle Target Configuration (Google Play 2025/2026 target API compliance)
  compileSdkVersion: 34, // Android 14
  minSdkVersion: 24,     // Android 7.0+
  targetSdkVersion: 34,  // Android 14
  recommendedGradleVersion: '8.7',
  recommendedAgpVersion: '8.5.2',
  javaTargetCompatibility: '17',

  // 4. Capacitor & Web Sync Architecture
  webBuildOutputDir: 'dist',
  capacitorConfigPath: 'capacitor.config.json',
  nativeAndroidProjectGenerated: false, // `/android` native folder is not generated yet in this web workspace

  // 5. Release Build & Signing Configuration
  releaseFormat: 'AAB',
  gradleBundleTask: './gradlew :app:bundleRelease',
  gradleAssembleReleaseTask: './gradlew :app:assembleRelease',
  productionSigningConfigured: false,
  signingMethod: 'UNCONFIGURED_EXTERNAL_KEYSTORE_REQUIRED',

  // 6. Google Play Billing Placeholders
  googlePlayBillingPlaceholders: {
    PRO_MONTHLY: 'PRO_MONTHLY',
    PRO_YEARLY: 'PRO_YEARLY',
    isPlaceholderOnly: true,
    billingLibraryDependency: 'com.android.billingclient:billing-ktx:7.1.1',
    billingPermission: 'com.android.vending.BILLING'
  },

  // 7. Theme & Manifest Metadata
  themeColor: '#4F46E5', // Indigo 600
  backgroundColor: '#0F172A', // Slate 900
  permissions: {
    required: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'com.android.vending.BILLING'
    ],
    forbidden: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.READ_CONTACTS',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO'
    ]
  },
  nativeFeatures: {
    localNotifications: 'requires_native',
    shareTarget: 'requires_native',
    mediaFilesystem: 'requires_native',
    persistentStorage: 'local_storage'
  }
};

/**
 * Versioning Strategy Helpers
 * Ensures `versionCode` always increments safely as an integer for Google Play uploads,
 * and validates semantic `versionName`.
 */
export function getNextReleaseVersionCode(currentVersionCode: number = ANDROID_CONFIG.versionCode): number {
  const normalized = Number.isInteger(currentVersionCode) && currentVersionCode >= 1 ? currentVersionCode : 1;
  return normalized + 1;
}

export function validateAndroidReleaseVersion(versionName: string, versionCode: number): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(versionName.trim())) {
    errors.push('versionName must follow semantic versioning (e.g., 1.0.0 or 1.2.0).');
  }
  if (!Number.isInteger(versionCode) || versionCode < 1 || versionCode > 2100000000) {
    errors.push('versionCode must be a positive integer between 1 and 2,100,000,000.');
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Structured Google Play & Android Release Readiness Report
 * Clearly separates READY, NOT_READY, and REQUIRES_CONFIGURATION items.
 */
export const GOOGLE_PLAY_READINESS_ITEMS: ReadinessCheckItem[] = [
  // READY
  {
    id: 'package_identity',
    label: 'Package Identity & Capacitor Config',
    status: 'READY',
    detail: 'capacitor.config.json and androidConfig.ts define appId/namespace com.socialsharescheduler.app and webDir "dist".'
  },
  {
    id: 'web_bundle_build',
    label: 'Web Asset Production Build (Vite -> dist)',
    status: 'READY',
    detail: 'Production web bundle compiles cleanly to dist/ for Capacitor Android asset synchronization.'
  },
  {
    id: 'central_subscription_architecture',
    label: 'Provider-Agnostic Subscription & Entitlement Architecture',
    status: 'READY',
    detail: 'Centralized subscriptionService, GooglePlayBillingAdapter, nativeBridge.billing hook, and server-side verification routes (/api/subscriptions/google-play/verify & webhook) are implemented.'
  },
  {
    id: 'product_id_placeholders',
    label: 'PRO_MONTHLY & PRO_YEARLY Product Placeholders',
    status: 'READY',
    detail: 'Centralized placeholders (PRO_MONTHLY / PRO_YEARLY) are isolated in config/plans.ts and androidConfig.ts without hardcoded prices.'
  },

  // NOT_READY
  {
    id: 'native_android_directory',
    label: 'Generated Native /android Gradle Project',
    status: 'NOT_READY',
    detail: 'No /android native directory exists yet. Requires installing @capacitor/core, @capacitor/cli, @capacitor/android and running "npx cap add android".'
  },
  {
    id: 'native_billing_plugin_bridge',
    label: 'Native Kotlin/Java Play Billing Client Implementation',
    status: 'NOT_READY',
    detail: 'window.AndroidBridge.billing JS interface contract is ready, but the native Android BillingClient (billing-ktx) implementation must be attached inside the generated /android project.'
  },
  {
    id: 'launcher_icons_and_splash',
    label: 'Native Adaptive Launcher Icons & Splash Drawables',
    status: 'NOT_READY',
    detail: 'Requires mipmap-anydpi-v26 adaptive launcher icons and splash screen resources inside /android/app/src/main/res.'
  },
  {
    id: 'aab_artifact_generation',
    label: 'Signed Android App Bundle (.aab) Artifact',
    status: 'NOT_READY',
    detail: 'Cannot build .aab inside the web container until /android is generated and Android SDK + JDK 17 + release keystore are present.'
  },

  // REQUIRES_CONFIGURATION
  {
    id: 'production_release_signing',
    label: 'Production Upload Keystore & Play App Signing',
    status: 'REQUIRES_CONFIGURATION',
    detail: 'Requires an external upload keystore (.jks) provided via environment variables or local key.properties outside git.'
  },
  {
    id: 'play_console_products',
    label: 'Google Play Console Subscription Products (PRO_MONTHLY / PRO_YEARLY)',
    status: 'REQUIRES_CONFIGURATION',
    detail: 'Requires uploading the first signed .aab to Google Play Console (Internal Testing track) before creating real subscription products and base plans.'
  },
  {
    id: 'play_developer_api_credentials',
    label: 'Google Play Developer API Service Account & RTDN Pub/Sub',
    status: 'REQUIRES_CONFIGURATION',
    detail: 'Backend requires GOOGLE_PLAY_SERVICE_ACCOUNT_JSON and GOOGLE_PLAY_RTDN_WEBHOOK_TOKEN to verify purchase tokens server-side.'
  },
  {
    id: 'standalone_api_base_url',
    label: 'Production Backend Origin (VITE_API_BASE_URL)',
    status: 'REQUIRES_CONFIGURATION',
    detail: 'Standalone Android .aab builds require VITE_API_BASE_URL pointing to the deployed HTTPS backend server.'
  }
];

