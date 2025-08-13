import { StyleSheet, Text, View, ImageBackground } from 'react-native'
import React from 'react'
import { scale, verticalScale } from '@/utils/styling'
import { colors, spacingX, spacingY } from '@/constants/theme'
import Typo from './Typo'
import { Feather, Entypo } from '@expo/vector-icons'; // ✅ Expo icon libraries
import useFetchData from '@/hooks/useFetchData'
import { WalletType } from '@/types'
import { orderBy, where } from 'firebase/firestore'
import { useAuth } from '@/contexts/authContext'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity } from 'react-native'; // Add this
import { useRouter } from 'expo-router'


const HomeCard = () => {

  const [showBalance, setShowBalance] = React.useState(false);

  const router = useRouter();
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

  const { data: wallets,
    error,
    loading: walletLoading
  } = useFetchData<WalletType
  >("wallets", [
    where("uid", "==", user?.uid),
    orderBy("created", "desc"),
  ]);

  const getTotals = () => {
    return wallets.reduce((totals: any, item: WalletType) => {
      totals.balance = totals.balance + Number(item.amount);
      totals.income = totals.income + Number(item.totalIncome);
      totals.expenses = totals.expenses + Number(item.totalExpenses);
      return totals;
    }, { balance: 0, income: 0, expenses: 0 })
  };

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

  React.useEffect(() => {
    loadCurrencySymbol();
  }, []);



  return (
    <ImageBackground
      source={require("../assets/images/card.png")}
      resizeMode="stretch"
      style={styles.bgImage}
    >
      <View style={styles.container}>
        <View>
          {/* total balance */}

          <View style={styles.balanceContainer}>
            {/* Left side: Balance + Eye icon */}
            <View style={styles.balanceRow}>
              <Typo color={colors.black} size={30} fontWeight={"bold"}>
                {walletLoading ? "----" : showBalance ? `${currencySymbol} ${getTotals()?.balance?.toFixed(2)}` : `${currencySymbol} ••••••`}
              </Typo>
              <TouchableOpacity onPress={() => setShowBalance(!showBalance)} style={{ marginLeft: 10 }}>
                <Feather name={showBalance ? "eye" : "eye-off"} size={verticalScale(22)} color={colors.black} />
              </TouchableOpacity>
            </View>

            {/* Right side: Reload icon */}
            <TouchableOpacity onPress={loadCurrencySymbol}>
              <Feather name="refresh-ccw" size={verticalScale(22)} color={colors.black} />
            </TouchableOpacity>
          </View>




        </View>
        <View style={styles.stats}>
          {/* income */}
          <View style={{ gap: verticalScale(5) }}>
            <View style={styles.incomeExpense}>
              <View style={styles.statsIcon}>
                <Feather
                  name="arrow-down"
                  size={verticalScale(15)}
                  color={colors.black}
                />

              </View>
              <Typo size={16} color={colors.neutral700} fontWeight={"500"}>
                Income
              </Typo>
            </View>
            <View style={{ alignSelf: "center" }}>
              <TouchableOpacity onPress={() => router.push('/(modals)/incomeModal')}>
                <Typo size={17} color={colors.green} fontWeight={"600"} >
                  {walletLoading ? "----" : showBalance ? `${currencySymbol} ${getTotals()?.income?.toFixed(2)}` : `${currencySymbol} ••••••`}
                </Typo>
              </TouchableOpacity>
            </View>
          </View>

          {/* Expense */}
          <View style={{ gap: verticalScale(5) }}>
            <View style={styles.incomeExpense}>
              <View style={styles.statsIcon}>
                <Feather
                  name="arrow-up"
                  size={verticalScale(15)}
                  color={colors.black}
                />

              </View>
              <Typo size={16} color={colors.neutral700} fontWeight={"500"}>
                Expense
              </Typo>
            </View>
            <TouchableOpacity onPress={() => router.push('/(modals)/expenseModal')}>
              <View style={{ alignSelf: "center" }}>
                <Typo size={17} color={colors.rose} fontWeight={"600"}>
                  {walletLoading ? "----" : showBalance ? `${currencySymbol} ${getTotals()?.expenses?.toFixed(2)}` : `${currencySymbol} ••••••`}

                </Typo>
              </View>
            </TouchableOpacity>

          </View>


        </View>
      </View>



    </ImageBackground>
  )
}

export default HomeCard

const styles = StyleSheet.create({
  bgImage: {
    height: scale(210),
    width: "100%",
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  


  container: {
    padding: spacingX._20,
    paddingHorizontal: scale(23),
    height: "87%",
    width: "100%",
    justifyContent: "space-between",
  },
  totalBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._5,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsIcon: {
    backgroundColor: colors.neutral350,
    padding: spacingY._5,
    borderRadius: 50,
  },
  incomeExpense: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingY._7,
  },
})