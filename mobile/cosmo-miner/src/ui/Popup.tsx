import React, { useEffect } from 'react';
import {
  BackHandler,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  type ImageSourcePropType
} from 'react-native';

type PopupProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  image?: ImageSourcePropType;
  images?: ImageSourcePropType[];
  text: string;
  clerk?: boolean;
  headerEmoji?: string;
  headerEmojiStyle?: StyleProp<TextStyle>;
  actionLabel?: string;
  onAction?: () => void;
};

export function Popup({
  visible,
  title,
  onClose,
  image,
  images,
  text,
  clerk,
  headerEmoji,
  headerEmojiStyle,
  actionLabel,
  onAction,
}: PopupProps) {
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible) {
    return null;
  }

  // Avoid RN Modal here: on some iOS/RN versions a dismissed transparent Modal
  // leaves a full-screen native view that still dims and intercepts touches.
  return (
    <View style={styles.layer}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {images && images.length > 0 ? (
            <View style={styles.imagesRow}>
              {images.map((src, i) => (
                <Image key={i} source={src} style={styles.image} resizeMode="contain" />
              ))}
            </View>
          ) : image ? (
            <Image source={image} style={styles.image} resizeMode="contain" />
          ) : null}

          {headerEmoji ? (
            <Text style={[styles.headerEmoji, headerEmojiStyle]}>
              {headerEmoji}
            </Text>
          ) : null}

          <View style={styles.body}>
            {clerk ? <Text style={styles.clerkEmoji}>🤖</Text> : null}
            <Text style={styles.text}>{text}</Text>
          </View>

          {actionLabel && onAction ? (
            <Pressable
              onPress={() => { onAction(); onClose(); }}
              style={({ pressed }) => [styles.actionBtn, pressed ? { opacity: 0.85 } : null]}
            >
              <Text style={styles.actionBtnText}>{actionLabel}</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100000,
    elevation: 24
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,5,20,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(4,16,45,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
    borderRadius: 16,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.12)'
  },
  title: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.85)',
    letterSpacing: 2
  },
  close: {
    fontSize: 16,
    color: 'rgba(0,212,255,0.4)',
    fontWeight: '700'
  },
  imagesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  image: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginTop: 20
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10 as any,
    padding: 16,
    paddingTop: 12
  },
  clerkEmoji: {
    fontSize: 26,
    flexShrink: 0
  },
  headerEmoji: {
    fontSize: 56,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 4
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(200,230,255,0.9)',
    lineHeight: 20,
    fontWeight: '500'
  },
  actionBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)',
    backgroundColor: 'rgba(0,212,255,0.08)',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00d4ff',
    letterSpacing: 1,
  },
});
