import React from 'react';
import {Platform,StyleSheet,View,ViewProps} from 'react-native';
import {BlurView} from 'expo-blur';
import {GlassView,isLiquidGlassAvailable} from 'expo-glass-effect';
import {colors} from '../design/tokens';
export function GlassPanel({children,style,...props}:ViewProps){const nativeGlass=Platform.OS==='ios'&&isLiquidGlassAvailable();return <View {...props} style={[styles.panel,style]}>{nativeGlass?<GlassView style={StyleSheet.absoluteFill} glassEffectStyle="regular"/>:Platform.OS==='ios'?<BlurView style={StyleSheet.absoluteFill} tint="dark" intensity={35}/>:null}{children}</View>}
const styles=StyleSheet.create({panel:{backgroundColor:'rgba(34,37,42,0.86)',borderColor:colors.border,borderWidth:1,borderRadius:26,overflow:'hidden',...(Platform.OS==='web'?{backdropFilter:'blur(24px)'}:{})}});
