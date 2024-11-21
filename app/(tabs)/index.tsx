import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Button,
  View,
  Modal,
  TouchableOpacity,
} from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

interface Pokemon {
  name: string;
  image: string;
}

export default function PokemonBattle() {
  const MAX_POKEMON_ID = 898;
  const INITIAL_HP = 100;

  const [playerPokemon, setPlayerPokemon] = useState<Pokemon | null>(null);
  const [opponentPokemon, setOpponentPokemon] = useState<Pokemon | null>(null);
  const [playerHP, setPlayerHP] = useState(INITIAL_HP);
  const [opponentHP, setOpponentHP] = useState(INITIAL_HP);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [showGameOverOptions, setShowGameOverOptions] = useState(false);

  useEffect(() => {
    loadPokemons();
  }, []);

  const fetchPokemonById = async (id: number): Promise<Pokemon> => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await response.json();
      return {
        name: data.name,
        image: data.sprites.front_default,
      };
    } catch (error) {
      console.error(`Failed to fetch Pokemon with id ${id}:`, error);
      throw error;
    }
  };

  const loadPokemons = async () => {
    const playerId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;
    const opponentId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;

    try {
      const [playerPokemonData, opponentPokemonData] = await Promise.all([
        fetchPokemonById(playerId),
        fetchPokemonById(opponentId),
      ]);

      setPlayerPokemon(playerPokemonData);
      setOpponentPokemon(opponentPokemonData);

      resetGameState();
    } catch (error) {
      console.error(error);
    }
  };

  const loadOpponentPokemon = async () => {
    const opponentId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;

    try {
      const opponentPokemonData = await fetchPokemonById(opponentId);
      setOpponentPokemon(opponentPokemonData);
      setOpponentHP(INITIAL_HP);
    } catch (error) {
      console.error(error);
    }
  };

  const resetGameState = () => {
    setPlayerHP(INITIAL_HP);
    setOpponentHP(INITIAL_HP);
    setGameOver(false);
    setMessage("");
  };

  const rollDice = () => {
    if (gameOver) return;

    const playerRolls = rollPlayerDice();
    const opponentRolls = rollPlayerDice();

    const playerTotal = playerRolls.reduce((a, b) => a + b, 0);
    const opponentTotal = opponentRolls.reduce((a, b) => a + b, 0);

    const newPlayerHP = Math.max(playerHP - opponentTotal, 0);
    const newOpponentHP = Math.max(opponentHP - playerTotal, 0);

    setPlayerHP(newPlayerHP);
    setOpponentHP(newOpponentHP);

    let newMessage = `You rolled ${playerRolls.join(
      "+"
    )} = ${playerTotal}. Opponent rolled ${opponentRolls.join(
      "+"
    )} = ${opponentTotal}.`;

    if (newPlayerHP <= 0 && newOpponentHP <= 0) {
      setGameOver(true);

      newMessage += " It's a draw!";
      setShowGameOverOptions(true);
    } else if (newPlayerHP <= 0) {
      setGameOver(true);

      newMessage += " Game Over!";
      setShowGameOverOptions(true);
    } else if (newOpponentHP <= 0) {
      setGameOver(true);

      newMessage += " You Win!";
      setShowGameOverOptions(true);
    }

    setMessage(newMessage);
  };

  const rollPlayerDice = (): number[] => {
    const rolls: number[] = [];
    let roll = Math.floor(Math.random() * 6) + 1;
    rolls.push(roll);
    if (roll === 6) {
      let extraRoll = Math.floor(Math.random() * 6) + 1;
      rolls.push(extraRoll);
    }
    return rolls;
  };

  const handleContinue = (continueWithSamePokemon: boolean) => {
    if (continueWithSamePokemon) {
      setPlayerHP(INITIAL_HP);
      setOpponentHP(INITIAL_HP);
      setGameOver(false);
      setMessage("");
      loadOpponentPokemon();
    } else {
      loadPokemons();
    }
  };

  const getHealthBarColor = (hp: number): string => {
    if (hp > 75) return "green";
    if (hp > 50) return "yellowgreen";
    if (hp > 25) return "yellow";
    if (hp > 10) return "orange";
    return "red";
  };

  if (!playerPokemon || !opponentPokemon) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading Pokémon...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={{ uri: playerPokemon.image }}
          style={styles.yourPokemon}
        />
      }
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.pokemonContainer}>
          <ThemedText type="title" style={styles.name}>
            {playerPokemon.name}
          </ThemedText>
          <Image source={{ uri: playerPokemon.image }} style={styles.image} />
          <ThemedText>HP: {playerHP}</ThemedText>
          <ThemedView style={styles.healthBarContainer}>
            <View
              style={{
                ...styles.healthBar,
                width: `${playerHP}%`,
                backgroundColor: getHealthBarColor(playerHP),
              }}
            />
          </ThemedView>
        </ThemedView>

        <ThemedText type="title" style={styles.vsText}>
          VS
        </ThemedText>

        <ThemedView style={styles.pokemonContainer}>
          <ThemedText type="title" style={styles.name}>
            {opponentPokemon.name}
          </ThemedText>
          <Image source={{ uri: opponentPokemon.image }} style={styles.image} />
          <ThemedText>HP: {opponentHP}</ThemedText>
          <ThemedView style={styles.healthBarContainer}>
            <View
              style={{
                ...styles.healthBar,
                width: `${opponentHP}%`,
                backgroundColor: getHealthBarColor(opponentHP),
              }}
            />
          </ThemedView>
        </ThemedView>

        <Button title="Attack" onPress={rollDice} disabled={gameOver} />

        {message !== "" && (
          <ThemedText style={styles.message}>{message}</ThemedText>
        )}

        {/* Game Over Modal */}
        <Modal
          transparent={true}
          animationType="fade"
          visible={showGameOverOptions}
          onRequestClose={() => {
            setShowGameOverOptions(false);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Game Over</ThemedText>
              <ThemedText>What would you like to do?</ThemedText>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  handleContinue(false);
                  setShowGameOverOptions(false);
                }}
              >
                <ThemedText style={styles.modalButtonText}>
                  Get New Pokemon
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  handleContinue(true);
                  setShowGameOverOptions(false);
                }}
              >
                <ThemedText style={styles.modalButtonText}>
                  Continue with new pokemon
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  pokemonContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    textTransform: "capitalize",
  },
  image: {
    width: 150,
    height: 150,
  },
  vsText: {
    fontSize: 32,
    marginVertical: 20,
  },
  message: {
    marginTop: 20,
    textAlign: "center",
  },
  statsContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  yourPokemon: {
    height: 178,
    width: 190,
    alignSelf: "center",
    marginTop: 40,
    position: "relative",
  },
  healthBarContainer: {
    width: 400,
    maxWidth: 300,
    height: 10,
    backgroundColor: "#ddd",
    borderRadius: 5,
    marginTop: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  healthBar: {
    height: "100%",
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    marginHorizontal: 30,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 10,
  },
  modalButton: {
    marginTop: 10,
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
