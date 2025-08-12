import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Tabs } from "expo-router";
import { TabBar } from "@/components/TabBar";

const TabLayout = () => {
    const { isAuthenticated, isLoading }: any = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.spinnerContainer}>
                    <ActivityIndicator
                        size="large"
                        color="#1E88E5"
                        style={styles.spinner}
                    />
                </View>
            </View>
        );
    }

    // if (!isAuthenticated) {
    //     return <Redirect href="/(auth)/login" />;
    // }

    return (
        <Tabs tabBar={props => <TabBar {...props} />}>
            <Tabs.Screen 
                name="index" 
                options={{ title: 'Home', headerShown: false }} 
            />
            <Tabs.Screen 
                name="agencies" 
                options={{ title: 'Agencies', headerShown: false }} 
            />
            <Tabs.Screen 
                name="profile" 
                options={{ title: 'Profile', headerShown: false }} 
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    spinnerContainer: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    spinner: {
        transform: [{ scale: 1.4 }]
    },
});

export default TabLayout;