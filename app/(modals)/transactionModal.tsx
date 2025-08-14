import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { scale, verticalScale } from '@/utils/styling'
import ScreenWrapper from '@/components/ScreenWrapper'
import ModalWrapper from '@/components/ModalWrapper'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import { Image } from 'expo-image'
import { getProfileImage } from '@/services/imageServices'
import Typo from '@/components/Typo'
import Input from '@/components/Input'
import { TransactionType, UserDataType, WalletType } from '@/types'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/authContext'
import { updateUser } from '@/services/userServices'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker';
import ImageUpload from '@/components/ImageUpload'
import { createOrUpdateWallet, deleteWallet } from '@/services/walletService'
import { Dropdown } from 'react-native-element-dropdown'
import { expenseCategories, transactionTypes } from '@/constants/data'
import useFetchData from '@/hooks/useFetchData'
import { orderBy, where } from 'firebase/firestore'
import { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { createOrUpdateTransaction, deleteTransaction } from '@/services/transactionService'
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TransactionModal = () => {

    const [currencySymbol, setCurrencySymbol] = React.useState('$'); // default fallbac

    React.useEffect(() => {
      const loadCurrencySymbol = async () => {
        try {
          const storedSymbol = await AsyncStorage.getItem('selectedCurrencySymbol');
          if (storedSymbol) {
            setCurrencySymbol(storedSymbol);
          }
        } catch (e) {
          console.log("Error loading currency symbol:", e);
        }
      };
  
      loadCurrencySymbol();
    }, []);
    const { user } = useAuth();
    const [showAdvancedFields, setShowAdvancedFields] = useState(false);
    const [transaction, setTransaction] = useState<TransactionType>({
        type: "expense",
        amount: 0,
        description: "",
        category: '',
        date: new Date(),
        walletId: "",
        image: null
    });

    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
          setTransaction({ ...transaction, date: selectedDate });
        }
    };
    
    const showDatepicker = () => {
        setShowDatePicker(true);
    };

    const { data: wallets,
        error: walletError,
        loading: walletLoading } = useFetchData<WalletType>("wallets", [
            where("uid", "==", user?.uid),
            orderBy("created", "desc"),
        ]);

    type paramType={
        id:string;
        type: string;
        amount: string;
        category:string;
        date: string;
        description: string;
        image?:any;
        uid: string;
        walletId: string;
    }
    
    const oldTransaction: paramType = useLocalSearchParams();

    useEffect(() => {
        if (oldTransaction?.id) {
            setTransaction({
                type: oldTransaction?.type,
                amount: Number(oldTransaction.amount),
                description: oldTransaction.description || "",
                category: oldTransaction.category || "",
                date: new Date(oldTransaction.date),
                walletId: oldTransaction.walletId,
                image: oldTransaction?.image,
            });
            // Show advanced fields if any of them has data
            if (oldTransaction.description || oldTransaction.image) {
                setShowAdvancedFields(true);
            }
        }
    }, []);

    const onSubmit = async () => {
        const { type, amount, description, category, date, walletId, image } = transaction;
        if (!walletId || !date || !amount || (type === 'expense' && !category)) {
            Alert.alert("Transaction", "Please fill all the fields");
            return;
        }
        
        let transactionData: TransactionType = {
            type,
            amount,
            description,
            category,
            date,
            walletId,
            image: image ? image: null,
            uid: user?.uid,
        };
        
        if(oldTransaction?.id) transactionData.id = oldTransaction.id;
        setLoading(true);
        const res = await createOrUpdateTransaction(transactionData);

        setLoading(false);
        if(res.success){
            router.back();
        }else{
            Alert.alert("Transaction", res.msg)
        }
    };
    
    const onDelete = async () => {
        if (!oldTransaction?.id) return;
        setLoading(true);
        const res = await deleteTransaction(oldTransaction?.id, oldTransaction.walletId);
        setLoading(false);
        if (res.success) {
            router.back();
        } else {
            Alert.alert("Transaction", res.msg);
        }
    };
    
    const categoryOptions = Object.keys(expenseCategories).map(key => ({
        label: expenseCategories[key].label,
        value: key
    }));
    
    const showDeleteAlert = () => {
        Alert.alert("Confirm", "Are you sure you want to delete this transaction?",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("cancel delete"),
                    style: 'cancel'
                },
                {
                    text: "Delete",
                    onPress: () => onDelete(),
                    style: 'destructive'
                }
            ]
        );
    }

    return (
        <ModalWrapper>
            <View style={styles.container}>
                <Header
                    title={oldTransaction?.id ? "Update Transaction" : "New Transaction"}
                    leftIcon={<BackButton />}
                    style={{ marginBottom: spacingY._10 }}
                />

                <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
                    {/* Type Input*/}
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200} size={16}>Type</Typo>
                        <Dropdown
                            style={styles.dropdownContainer}
                            activeColor={colors.neutral700}
                            placeholderStyle={styles.dropdownPlaceholder}
                            selectedTextStyle={styles.dropdownSelectedText}
                            iconStyle={styles.dropdownIcon}
                            data={transactionTypes}
                            maxHeight={200}
                            labelField="label"
                            valueField="value"
                            itemTextStyle={styles.dropdownItemText}
                            itemContainerStyle={styles.dropdownItemContainer}
                            containerStyle={styles.dropdownListContainer}
                            value={transaction.type}
                            onChange={(item) => {
                                setTransaction({ ...transaction, type: item.value });
                            }}
                        />
                    </View>

                    {/* Wallet Input*/}
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200} size={16}>Wallet</Typo>
                        <Dropdown
                            style={styles.dropdownContainer}
                            activeColor={colors.neutral700}
                            placeholderStyle={styles.dropdownPlaceholder}
                            selectedTextStyle={styles.dropdownSelectedText}
                            iconStyle={styles.dropdownIcon}
                            data={wallets.map(wallet => ({
                                label: `${wallet?.name}  •  ${currencySymbol}${wallet.amount?.toFixed(2)}`,
                                value: wallet?.id,
                            }))}
                            maxHeight={200}
                            labelField="label"
                            valueField="value"
                            itemTextStyle={styles.dropdownItemText}
                            itemContainerStyle={styles.dropdownItemContainer}
                            containerStyle={styles.dropdownListContainer}
                            placeholder={'Select Wallet'}
                            value={transaction.walletId}
                            onChange={(item) => {
                                setTransaction({ ...transaction, walletId: item.value || "" });
                            }}
                        />
                    </View>

                    {/* expense categories*/}
                    {transaction.type == 'expense' && (
                        <View style={styles.inputContainer}>
                            <Typo color={colors.neutral200} size={16}>Expense Category</Typo>
                            <Dropdown
                                style={styles.dropdownContainer}
                                activeColor={colors.neutral700}
                                placeholderStyle={styles.dropdownPlaceholder}
                                selectedTextStyle={styles.dropdownSelectedText}
                                iconStyle={styles.dropdownIcon}
                                data={Object.values(expenseCategories)}
                                maxHeight={200}
                                labelField="label"
                                valueField="value"
                                itemTextStyle={styles.dropdownItemText}
                                itemContainerStyle={styles.dropdownItemContainer}
                                containerStyle={styles.dropdownListContainer}
                                placeholder={'Select'}
                                value={transaction.category}
                                onChange={(item) => {
                                    setTransaction({
                                        ...transaction,
                                        category: item.value || "",
                                    });
                                }}
                            />
                        </View>
                    )}

                    {/* Amount Input */}
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200} size={16}>Amount</Typo>
                        <Input
                            keyboardType='numeric'
                            value={transaction.amount?.toString()}
                            onChangeText={(value) => setTransaction({
                                ...transaction,
                                amount: Number(value.replace(/[^0-9]/g, ""))
                            })}
                        />
                    </View>

                    {/* Advanced Fields Toggle */}
                    <TouchableOpacity 
                        style={styles.advancedToggle} 
                        onPress={() => setShowAdvancedFields(!showAdvancedFields)}
                    >
                        <Typo color={colors.neutral300} size={14}>
                            {showAdvancedFields ? 'Hide additional fields' : 'Show additional fields'}
                        </Typo>
                        <Feather 
                            name={showAdvancedFields ? 'chevron-up' : 'chevron-down'} 
                            size={20} 
                            color={colors.neutral300} 
                        />
                    </TouchableOpacity>

                    {/* Advanced Fields (Date, Description, Receipt) */}
                    {showAdvancedFields && (
                        <>
                            {/* Date Picker Section */}
                            <View style={styles.inputContainer}>
                                <Typo color={colors.neutral200} size={16}>Date</Typo>
                                <Pressable
                                    style={styles.dateInput}
                                    onPress={showDatepicker}
                                >
                                    <Typo size={14}>
                                        {(transaction.date as Date).toLocaleDateString()}
                                    </Typo>
                                </Pressable>
                                
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={transaction.date as Date}
                                        mode="date"
                                        display="default"
                                        onChange={onChangeDate}
                                        themeVariant="dark"
                                        textColor={colors.white}
                                        accentColor={colors.primary}
                                    />
                                )}
                            </View>

                            {/* Description */}
                            <View style={styles.inputContainer}>
                                <View style={styles.flexRow}>
                                    <Typo color={colors.neutral200} size={16}>Description</Typo>
                                    <Typo color={colors.neutral500} size={14}>(Optional)</Typo>
                                </View>
                                <Input
                                    value={transaction.description}
                                    multiline
                                    containerStyle={{
                                        flexDirection: 'row',
                                        height: verticalScale(100),
                                        alignItems: 'flex-start',
                                        paddingVertical: 15,
                                    }}
                                    onChangeText={(value) =>
                                        setTransaction({
                                            ...transaction,
                                            description: value,
                                        })
                                    }
                                />
                            </View>

                            {/* Receipt */}
                            <View style={styles.inputContainer}>
                                <View style={styles.flexRow}>
                                    <Typo color={colors.neutral200} size={16}>Receipt</Typo>
                                    <Typo color={colors.neutral500} size={14}>(Optional)</Typo>
                                </View>
                                <ImageUpload 
                                    file={transaction.image}
                                    onClear={() => setTransaction({ ...transaction, image: null })}
                                    onSelect={file => setTransaction({ ...transaction, image: file })}
                                    placeholder='Upload Image'
                                />
                            </View>
                        </>
                    )}
                </ScrollView>
            </View>

            <View style={styles.footer}>
                {oldTransaction?.id && !loading && (
                    <Button
                        onPress={showDeleteAlert}
                        style={{
                            backgroundColor: colors.rose,
                            paddingHorizontal: spacingX._15,
                        }}
                    >
                        <Feather
                            name="trash-2"
                            color={colors.white}
                            size={verticalScale(24)}
                        />
                    </Button>
                )}
                <Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
                    <Typo color={colors.black} fontWeight={'700'}>
                        {oldTransaction?.id ? "Update" : "Submit"}
                    </Typo>
                </Button>
            </View>
        </ModalWrapper>
    )
}

export default TransactionModal

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacingY._20,
    },
    form: {
        gap: spacingY._20,
        paddingVertical: spacingY._15,
        paddingBottom: spacingY._40,
    },
    footer: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        paddingHorizontal: spacingX._20,
        gap: scale(12),
        paddingTop: spacingY._15,
        borderTopColor: colors.neutral700,
        marginBottom: spacingY._5,
        borderTopWidth: 1,
    },
    inputContainer: {
        gap: spacingY._10,
    },
    flexRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacingX._5,
    },
    dateInput: {
        flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        paddingHorizontal: spacingX._15,
    },
    dropdownContainer: {
        height: verticalScale(54),
        borderWidth: 1,
        borderColor: colors.neutral300,
        paddingHorizontal: spacingX._15,
        borderRadius: radius._15,
        borderCurve: "continuous",
    },
    dropdownItemText: { color: colors.white },
    dropdownSelectedText: {
        color: colors.white,
        fontSize: verticalScale(14),
    },
    dropdownListContainer: {
        backgroundColor: colors.neutral900,
        borderRadius: radius._15,
        borderCurve: "continuous",
        paddingVertical: spacingY._7,
        top: 5,
        borderColor: colors.neutral500,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5,
    },
    dropdownPlaceholder: {
        color: colors.white,
    },
    dropdownItemContainer: {
        borderRadius: radius._15,
        marginHorizontal: spacingX._7,
    },
    dropdownIcon: {
        height: verticalScale(30),
        tintColor: colors.neutral300,
    },
    advancedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacingY._10,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral700,
        marginBottom: spacingY._10,
    },
})