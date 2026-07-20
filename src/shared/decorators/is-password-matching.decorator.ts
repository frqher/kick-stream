import {
	type ValidationArguments,
	ValidatorConstraint,
	type ValidatorConstraintInterface
} from 'class-validator'
import { NewPasswordInput } from 'src/modules/auth/password-recovery/inputs/new-password.input'

@ValidatorConstraint({ name: 'isPasswordsMatching', async: false })
export class IsPasswordsMatching implements ValidatorConstraintInterface {
	public validate(passwordRepeat: string, args: ValidationArguments) {
		const object = args.object as NewPasswordInput

		return object.password === passwordRepeat
	}

	public defaultMessage(): string {
		return 'Passwords do not match'
	}
}
