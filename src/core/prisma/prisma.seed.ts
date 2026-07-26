import { BadRequestException, Logger } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { Prisma, PrismaClient } from '@prisma/client'
import { hash } from 'argon2'
import 'dotenv/config'
import { Pool } from 'pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({
	adapter,
	transactionOptions: {
		maxWait: 5000,
		timeout: 10000,
		isolationLevel: Prisma.TransactionIsolationLevel.Serializable
	}
})

async function main() {
	try {
		Logger.log('Seeding started')

		await prisma.$transaction([
			prisma.user.deleteMany(),
			prisma.socialLink.deleteMany(),
			prisma.stream.deleteMany(),
			prisma.category.deleteMany()
		])

		const categoriesData = [
			{
				title: 'CS2',
				slug: 'cs2',
				thumbnailUrl: '/categories/cs2.webp',
				description:
					'Counter-Strike 2 is a tactical first-person shooter game.'
			},
			{
				title: 'Dota 2',
				slug: 'dota-2',
				thumbnailUrl: '/categories/dota2.webp',
				description: 'A multiplayer online battle arena (MOBA) game.'
			},
			{
				title: 'FC26',
				slug: 'fc26',
				thumbnailUrl: '/categories/fc26.webp',
				description: 'A football simulation video game.'
			},
			{
				title: 'Fortnite',
				slug: 'fortnite',
				thumbnailUrl: '/categories/fortnite.webp',
				description:
					'A popular battle royale game with unique building mechanics.'
			},
			{
				title: 'Grand Theft Auto V',
				slug: 'grand-theft-auto-v',
				thumbnailUrl: '/categories/gta_v.webp',
				description: 'An open-world action-adventure game.'
			},
			{
				title: 'IRL',
				slug: 'irl',
				thumbnailUrl: '/categories/irl.webp',
				description:
					'In Real Life streams showcasing everyday activities.'
			},
			{
				title: 'Just Chatting',
				slug: 'just-chatting',
				thumbnailUrl: '/categories/just_chatting.webp',
				description:
					'Streams focused on talking and interacting directly with the audience.'
			},
			{
				title: 'League of Legends',
				slug: 'league-of-legends',
				thumbnailUrl: '/categories/lol.webp',
				description: 'A fast-paced, competitive online MOBA game.'
			},
			{
				title: 'PUBG',
				slug: 'pubg',
				thumbnailUrl: '/categories/pubg.webp',
				description: 'A highly competitive battle royale shooter.'
			},
			{
				title: 'Valorant',
				slug: 'valorant',
				thumbnailUrl: '/categories/valorant.webp',
				description: 'A 5v5 character-based tactical shooter.'
			}
		]

		await prisma.category.createMany({
			data: categoriesData
		})

		const categories = await prisma.category.findMany()

		const categoriesBySlug = Object.fromEntries(
			categories.map(category => [category.slug, category])
		)

		const streamTitles = {
			cs2: [
				'Road to Global Elite! 🎯',
				'CS2 Pro Tips & Tricks 🧠',
				'Insane AWP Clutches Only 🔥',
				'Late Night Competitive Grind 🌙',
				'Warmup & Ranked Matches ⚔️',
				'Smurfing in Silver Lobbies 😂',
				'Case Openings - Knives Only?! 🔪',
				'FPL Challenger Matches 🏆',
				'Teaching Subs How to Spray 🎓'
			],
			'dota-2': [
				'MMR Grind: Road to Immortal 🛡️',
				'Mid Lane Domination! 👑',
				'Crazy Invoker Combos 🌪️',
				'Battle Cup Finals with the Boyz 🏆',
				'Trying New Meta Builds 🧪',
				'Support Life: Ward & Win 👁️',
				'Late Night Pubs 🌙',
				'Coaching Viewers - Replay Analysis 📈',
				'TI Qualifiers Watch Party 🎉'
			],
			fc26: [
				'Ultimate Team Pack Openings! ⚽',
				'Division Rivals Grind to Elite 🏆',
				'FUT Champions Finals - Rank 1 Push 🥇',
				'Building the Best Premier League Squad 🇬🇧',
				'Pro Player Tactics & Custom Tactics 🧠',
				'RTG - Road to Glory Episode 12 🛣️',
				'Draft Challenge - Can We Go 4-0? 🏟️',
				'Career Mode - Rebuilding Manchester United 🔴',
				'Playing Viewers - Send Invites! 🎮'
			],
			fortnite: [
				'Zero Build Solo Wins! 🏆',
				'Arena Cash Cup Finals 💰',
				'Custom Lobbies with Subs 🎉',
				'New Season Ranked Grind! 📈',
				'Box Fights & Zone Wars 🥊',
				'Creative Mode Trickshots 🎯',
				'Squads with Randoms Challenge 😂',
				'Dropping 20+ Bombs Today 🔥',
				'Live Event Watch Party 🚀'
			],
			'grand-theft-auto-v': [
				'NoPixel RP: The Heist of the Century 💰',
				'GTA Online: Casino Heist with Subs 🎲',
				'Roleplay: Detective POV 🕵️‍♂️',
				'Cruising Los Santos & Vibing 🚗',
				'FiveM Funny Moments 😂',
				'Gang Wars - Turf Takeover 🔫',
				'Cayo Perico Speedruns 🏝️',
				'Custom Races & Stunts 🏎️',
				'Starting a New Business Empire 🏢'
			],
			irl: [
				'Exploring Tokyo Streets! 🗼',
				'First Time Trying Exotic Foods 🍣',
				'Gym Stream: Leg Day 🏋️‍♂️',
				'Camping in the Wilderness 🏕️',
				'Shopping & Thrifting Spree 🛍️',
				'Theme Park Rollercoaster POV 🎢',
				'Driving Across the Country 🚗',
				'Cooking a 5-Star Meal Live 👨‍🍳',
				'Walking Around New York City 🗽'
			],
			'just-chatting': [
				'Reacting to Daily Dose of Internet 📺',
				'YLYL Challenge (You Laugh You Lose) 😂',
				'Reading Your Wildest Confessions 😳',
				'Tier List: Ranking Fast Food 🍔',
				'Story Time: My Worst Date Ever 📖',
				'Chill Vibes & Lo-Fi Music 🎧',
				'Answering Q&A from Chat 💬',
				'Watching Funny TikToks 📱',
				'Late Night Deep Talks 🌙'
			],
			'league-of-legends': [
				'Challenger Push: Mid Lane 👑',
				'OTP Yasuo/Yone Mechanics 🌪️',
				'Smurf Queue is Hell 👿',
				'Clash Finals with the Squad 🏆',
				'Playing Off-Meta Supports 🧪',
				'Viewer Games - 5v5 Custom ⚔️',
				'Reviewing VODs - How to Improve 📈',
				'Unboxing Hextech Chests 💎',
				'Worlds Watch Party 🌍'
			],
			pubg: [
				'Erangel Only - High Kills 🔥',
				'Ranked Squads - Chicken Dinners 🍗',
				'Sniping and Hot Drops 🎯',
				'Solo vs Squads Challenge ⚔️',
				'Custom Games with Chat 🎉',
				'Esports Tournament Watch Party 🏆',
				'Road to Conqueror 🥇',
				'Glider Drive-Bys Only ✈️',
				'New Map Exploration & Testing 🗺️'
			],
			valorant: [
				'Radiant Ranked Grind 💎',
				'Insane Jett Operator Clutches 🎯',
				'Teaching You Crosshair Placement 🧠',
				'Premier League Match Day 🏆',
				'VCT Watch Party - Grand Finals 📺',
				'Only Headshots - Sheriff Only Challenge 🤠',
				'Iron to Radiant Speedrun 🏃‍♂️',
				'10 Man Custom Lobbies with Subs 🎮',
				'Lineups & Setups for Every Map 🗺️'
			]
		}

		const usernames = [
			'stintik',
			'shadow_ninja',
			'pixel_warrior',
			'quantum_leap',
			'cyber_ghost',
			'neon_rider',
			'cosmic_drift',
			'alpha_wolf',
			'beta_tester',
			'gamma_ray',
			'delta_force',
			'epsilon_elite',
			'zeta_prime',
			'omega_strike',
			'void_walker',
			'star_gazer',
			'moon_light',
			'sun_flare',
			'nebula_dust',
			'galaxy_quest',
			'super_nova',
			'black_hole',
			'event_horizon',
			'time_traveler',
			'space_invader',
			'retro_gamer',
			'arcade_master',
			'console_king',
			'pc_master_race',
			'mobile_legend',
			'vr_explorer',
			'ar_visionary',
			'ai_bot',
			'cyborg_ninja',
			'robot_overlord',
			'hacker_man',
			'script_kiddie',
			'code_monkey',
			'bug_hunter',
			'glitch_in_the_matrix',
			'easter_egg',
			'boss_fight',
			'final_level',
			'game_over',
			'continue_yes',
			'high_score',
			'speed_runner',
			'loot_goblin',
			'grind_master',
			'pay_to_win'
		]

		await prisma.$transaction(async tx => {
			for (const username of usernames) {
				const randomCategory =
					categoriesBySlug[
						Object.keys(categoriesBySlug)[
							Math.floor(
								Math.random() *
									Object.keys(categoriesBySlug).length
							)
						]
					]

				const userExists = await tx.user.findUnique({
					where: { username }
				})

				if (!userExists) {
					const createdUser = await tx.user.create({
						data: {
							email: `${username}@ruslandev.com`,
							password: await hash('12345678'),
							username,
							displayName: username,
							avatar: `/channels/${username}.webp`,
							isEmailVerified: true,
							socialLinks: {
								createMany: {
									data: [
										{
											title: 'Youtube',
											url: `https://youtube.com/${username}`,
											position: 1
										},
										{
											title: 'X',
											url: `https://x.com/${username}`,
											position: 2
										},
										{
											title: 'Instagram',
											url: `https://instagram.com/${username}`,
											position: 3
										},
										{
											title: 'TikTok',
											url: `https://tiktok.com/${username}`,
											position: 4
										},
										{
											title: 'Github',
											url: `https://github.com/${username}`,
											position: 5
										}
									]
								}
							}
						}
					})

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const randomTitles = streamTitles[randomCategory.slug]

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const randomTitle =
						randomTitles[
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
							Math.floor(Math.random() * randomTitles.length)
						]

					await tx.stream.create({
						data: {
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							title: randomTitle,
							thumbnailUrl: `/streams/${createdUser.username}.webp`,
							user: {
								connect: {
									id: createdUser.id
								}
							},
							category: {
								connect: {
									id: randomCategory.id
								}
							}
						}
					})

					Logger.log(
						`Created user ${createdUser.username} and stream ${randomTitle}`
					)
				}
			}
		})

		Logger.log('Seeding completed')
	} catch (error) {
		Logger.error(error)
		throw new BadRequestException('Seeding failed')
	} finally {
		await prisma.$disconnect()
		Logger.log('Prisma disconnected')
		process.exit(0)
	}
}

void main()
