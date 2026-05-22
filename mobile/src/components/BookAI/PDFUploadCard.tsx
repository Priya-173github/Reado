import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BookMeta } from '../../types/bookAI.types';
import { COLORS } from '../../screens/BookAI/BookAIChatScreen.styles';

interface PDFUploadCardProps {
  bookMeta: BookMeta | null;
  isExtracting: boolean;
  onUploadPress: () => void;
}

export const PDFUploadCard = memo(
  ({ bookMeta, isExtracting, onUploadPress }: PDFUploadCardProps) => {
    // No book yet — show upload trigger row
    if (!bookMeta) {
      return (
        <TouchableOpacity
          style={styles.uploadTrigger}
          onPress={onUploadPress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Upload a PDF book"
        >
          <View style={styles.uploadIconWrap}>
            <Text style={styles.uploadEmoji}>📄</Text>
          </View>
          <View style={styles.uploadTriggerText}>
            <Text style={styles.uploadTriggerTitle}>Upload a book PDF</Text>
            <Text style={styles.uploadTriggerSub}>Tap to choose from your files</Text>
          </View>
          <Text style={styles.uploadArrow}>›</Text>
        </TouchableOpacity>
      );
    }

    // Extracting or ready — show progress banner
    return (
      <View style={styles.banner}>
        <View style={styles.iconWrap}>
          <Text style={styles.pdfEmoji}>📕</Text>
        </View>

        <View style={styles.bannerBody}>
          <Text style={styles.fileName} numberOfLines={1}>
            {bookMeta.fileName}
          </Text>
          <Text style={styles.statusText}>
            {isExtracting
              ? `Extracting… ${bookMeta.uploadProgress}%`
              : `${bookMeta.totalPages} pages · ${bookMeta.totalChunks} chunks indexed`}
          </Text>

          {isExtracting && (
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${bookMeta.uploadProgress}%` }]}
              />
            </View>
          )}
        </View>

        {isExtracting ? (
          <Text style={styles.percentLabel}>{bookMeta.uploadProgress}%</Text>
        ) : (
          <TouchableOpacity
            onPress={onUploadPress}
            accessibilityRole="button"
            accessibilityLabel="Replace book"
          >
            <Text style={styles.replaceBtn}>Replace</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

PDFUploadCard.displayName = 'PDFUploadCard';

const styles = StyleSheet.create({
  // Upload trigger (no book yet)
  uploadTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 13,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    gap: 10,
  },
  uploadIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(200,169,110,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadEmoji: { fontSize: 18 },
  uploadTriggerText: { flex: 1 },
  uploadTriggerTitle: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  uploadTriggerSub: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  uploadArrow: { fontSize: 20, color: COLORS.textDim },

  // Progress banner (extracting / ready)
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(200,169,110,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pdfEmoji: { fontSize: 18 },
  bannerBody: { flex: 1, minWidth: 0 },
  fileName: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  statusText: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  progressBar: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },
  percentLabel: { fontSize: 11, color: COLORS.gold, fontWeight: '500', flexShrink: 0 },
  replaceBtn: { fontSize: 12, color: COLORS.gold },
});
