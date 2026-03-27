import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, TextProps } from "react-native";

interface TypewriterTextProps extends Omit<TextProps, "children"> {
  text: string;
  speed?: number; // ms per character
  onDone?: () => void;
}

export function TypewriterText({ text, speed = 30, onDone, style, ...rest }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState(0);
  const done = displayed >= text.length;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayed(text.length);
  }, [text.length]);

  useEffect(() => {
    setDisplayed(0);
    intervalRef.current = setInterval(() => {
      setDisplayed((prev) => {
        if (prev >= text.length) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return prev;
        }
        return prev + 1;
      });
    }, speed);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed]);

  useEffect(() => {
    if (done) onDone?.();
  }, [done, onDone]);

  return (
    <Pressable onPress={done ? undefined : finish}>
      <Text style={style} {...rest}>
        {text.slice(0, displayed)}
      </Text>
    </Pressable>
  );
}
