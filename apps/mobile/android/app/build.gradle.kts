import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Clé de signature officielle : lue dans android/key.properties (jamais dans le dépôt).
// Sur votre PC : fichier écrit à la main. Sur GitHub : écrit par le workflow à partir des secrets.
// Sans ce fichier, l'APK est signée avec la clé de débogage (tests seulement).
val cleSignature = Properties().apply {
    val f = rootProject.file("key.properties")
    if (f.exists()) FileInputStream(f).use { load(it) }
}

android {
    namespace = "tn.wa9tech.wa9tech"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        // Requis par flutter_local_notifications (rappels programmés)
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "tn.wa9tech.wa9tech"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        // Android 7.0 minimum (exigé par flutter_local_notifications)
        minSdk = maxOf(flutter.minSdkVersion, 24)
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("officielle") {
            if (!cleSignature.isEmpty) {
                storeFile = file(cleSignature.getProperty("storeFile"))
                storePassword = cleSignature.getProperty("storePassword")
                keyAlias = cleSignature.getProperty("keyAlias")
                keyPassword = cleSignature.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (cleSignature.isEmpty) signingConfigs.getByName("debug") else signingConfigs.getByName("officielle")
            // Pas de réduction R8 : elle supprimait des fonctions natives appelées par
            // shared_preferences (NoSuchMethodError ... SharedPreferencesApiRegistrar.getAll)
            // et l'application ne démarrait pas. Coût : APK un peu plus lourde.
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}
