import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { searchMedications, MedicationEntry } from '../db/medicationLookup';

interface MedicationAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectMedication?: (entry: MedicationEntry) => void;
  placeholder?: string;
  testID?: string;
}

export function MedicationAutocomplete({
  value,
  onChangeText,
  onSelectMedication,
  placeholder = 'Enter medication name',
  testID,
}: MedicationAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (!showSuggestions || value.trim().length < 2) return [];
    return searchMedications(value, 10);
  }, [value, showSuggestions]);

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);
      setShowSuggestions(text.trim().length >= 2);
    },
    [onChangeText]
  );

  const handleSelect = useCallback(
    (entry: MedicationEntry) => {
      onChangeText(entry.brandName);
      setShowSuggestions(false);
      onSelectMedication?.(entry);
    },
    [onChangeText, onSelectMedication]
  );

  const handleFocus = useCallback(() => {
    if (value.trim().length >= 2) {
      setShowSuggestions(true);
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    // Delay to allow tap on suggestion to register
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  const renderSuggestion = useCallback(
    ({ item }: { item: MedicationEntry }) => (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSelect(item)}
        testID={`suggestion-${item.brandName}`}
      >
        <Text style={styles.suggestionName}>{item.brandName}</Text>
        <Text style={styles.suggestionDetail}>
          {item.genericName}
          {item.strength ? ` • ${item.strength}` : ''}
          {item.type ? ` • ${item.type}` : ''}
        </Text>
        <Text style={styles.suggestionManufacturer}>{item.manufacturer}</Text>
      </TouchableOpacity>
    ),
    [handleSelect]
  );

  return (
    <View style={styles.container} testID={testID}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.disabledText}
        autoCapitalize="words"
        testID={testID ? `${testID}-input` : undefined}
      />
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) =>
              `${item.brandName}-${item.strength}-${item.manufacturer}`
            }
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionsList}
            nestedScrollEnabled
          />
          <TouchableOpacity
            style={styles.customOption}
            onPress={() => setShowSuggestions(false)}
            testID="use-custom-name"
          >
            <Text style={styles.customOptionText}>
              ✏️ Use &quot;{value}&quot; as custom name
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 0,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    maxHeight: 250,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  suggestionName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  suggestionDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  suggestionManufacturer: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 1,
  },
  customOption: {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  customOptionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
