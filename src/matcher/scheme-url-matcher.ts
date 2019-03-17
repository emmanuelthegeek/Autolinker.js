import { letterRe, alphaNumericCharsRe } from "../regex-lib";
import { UrlMatch } from "../match/url-match";
import { Match } from "../match/match";
import { isUndefined, throwUnhandledCaseError } from '../utils';
import { UrlMatcher } from './url-matcher';
import { readAuthority as doReadAuthority } from './reader/read-authority';
import { isAuthorityStartChar, isUrlSuffixStartChar, isPChar } from '../uri-utils';
import { readUrlSuffix as doReadUrlSuffix } from './reader/read-url-suffix';


// For debugging: search for and uncomment other "For debugging" lines
import CliTable from 'cli-table';

/**
 * @class Autolinker.matcher.SchemeUrl
 * @extends Autolinker.matcher.Matcher
 *
 * Matcher to find URL matches in an input string that begin with a scheme (aka
 * protocol) such as `http://`.
 * 
 * For example, this matcher finds links such as `http://google.com`, as opposed 
 * to `google.com` which is handled by the {@link Autolinker.matcher.TldUrl TldUrl} 
 * matcher.
 * 
 * See this class's superclass ({@link Autolinker.matcher.UrlMatcher}) for more 
 * details.
 */
export class SchemeUrlMatcher extends UrlMatcher {

	/**
	 * @inheritdoc
	 */
	parseMatches( text: string ) {
		const tagBuilder = this.tagBuilder,
		      stripPrefix = this.stripPrefix,
		      stripTrailingSlash = this.stripTrailingSlash,
		      decodePercentEncoding = this.decodePercentEncoding,
		      matches: Match[] = [],
		      len = text.length,
			  noCurrentUrl = new CurrentUrl();
			  
		let charIdx = 0,
			state = State.NonUrl as State,  // use switchToState() to modify
			currentUrl = noCurrentUrl;

		// For debugging: search for and uncomment other "For debugging" lines
		const table = new CliTable( {
			head: [ 'charIdx', 'char', 'state', 'currentUrl.idx', 'lastConfirmedCharIdx' ]
		} );

		while( charIdx < len ) {
			const char = text.charAt( charIdx );

			// For debugging: search for and uncomment other "For debugging" lines
			table.push( 
				[ charIdx, char, State[ state ], currentUrl.idx, currentUrl.lastConfirmedUrlCharIdx ] 
			);

			switch( state ) {
				case State.NonUrl: stateNonUrl( char ); break;

				case State.SchemeChar: stateSchemeChar( char ); break;
				case State.SchemeColon: stateSchemeColon( char ); break;
				case State.SchemeSlash1: stateSchemeSlash1( char ); break;
				case State.SchemeSlash2: stateSchemeSlash2( char ); break;

				case State.PathRootless: statePathRootless( char ); break;
				case State.PathRootlessDot: statePathRootlessDot( char ); break;

				case State.EndOfAuthority: stateEndOfAuthority( char ); break;
				case State.EndOfUrlSuffix: stateEndOfUrlSuffix( char ); break;

				default: 
					throwUnhandledCaseError( state );
			}

			// For debugging: search for and uncomment other "For debugging" lines
			table.push( 
				[ charIdx, char, State[ state ], currentUrl.idx, currentUrl.lastConfirmedUrlCharIdx ] 
			);

			charIdx++;
		}

		// Capture any valid match at the end of the string
		captureMatchIfValidAndReset();

		// For debugging: search for and uncomment other "For debugging" lines
		//console.log( '\n' + table.toString() );
		
		return matches;


		// Handles the state when we're not in a URL
		function stateNonUrl( char: string ) {
			if( letterRe.test( char ) ) {
				// An uppercase or lowercase letter may start a scheme
				beginUrl( State.SchemeChar );

			} else {
				// Anything else, remain in the non-url state
			}
		}


		// Implements ABNF: ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
		function stateSchemeChar( char: string ) {
			if( char === '+' || char === '-' || char === '.' ) {
				// Stay in SchemeChar state (but don't necessarily capture the
				// character unless other "confirmed" characters come after it

				// TODO: this is probably going to be a problem, esp with the
				// google.com+yahoo.com scenario, but handle this later

			} else if( char === ':' ) {
				switchToState( State.SchemeColon );

			} else if( alphaNumericCharsRe.test( char ) ) {
				// Stay in SchemeChar state, but capture the character as a 
				// "confirmed" URL character
				captureCharAndSwitchToState( State.SchemeChar );

			} else {
				// Any other character, not a scheme
				resetToNonUrlState();
			}
		}


		function stateSchemeColon( char: string ) {
			if( char === '/' ) {
				currentUrl = new CurrentUrl( { ...currentUrl, hasCharAfterColon: true } );
				switchToState( State.SchemeSlash1 );

			} else if( char === '.' ) {
				// We've read something like 'hello:.' - don't capture
				resetToNonUrlState();

			} else if( isUrlSuffixStartChar( char ) ) {
				currentUrl = new CurrentUrl( { ...currentUrl, hasCharAfterColon: true } );
				readUrlSuffix();

			} else if( isPChar( char ) ) {
				currentUrl = new CurrentUrl( { ...currentUrl, hasCharAfterColon: true } );
				captureCharAndSwitchToState( State.PathRootless );

			} else {
				resetToNonUrlState();
			}
		}


		function stateSchemeSlash1( char: string ) {
			if( char === '/' ) {
				switchToState( State.SchemeSlash2 );

			} else if( isPChar( char ) ) {
				// Back up and read the character as a URL suffix (path+query+hash)
				// starting with the previous '/'
				charIdx--;
				readUrlSuffix();

			} else {
				captureMatchIfValidAndReset();
			}
		}


		function stateSchemeSlash2( char: string ) {
			if( char === '/' ) {  
				// 3rd slash, must be an absolute path (path-absolute in the
				// ABNF), such as in a file:///c:/windows/etc. See
				// https://tools.ietf.org/html/rfc3986#appendix-A
				readUrlSuffix();

			} else if( isAuthorityStartChar( char ) ) {
				// start of "authority" section - see https://tools.ietf.org/html/rfc3986#appendix-A
				readAuthority();

			} else {
				resetToNonUrlState();
			}
		}


		function statePathRootless( char: string ) {
			if( char === '.' ) {
				switchToState( State.PathRootlessDot );

			} else if( isUrlSuffixStartChar( char ) ) {
				readUrlSuffix();

			} else if( isPChar( char ) ) {
				captureCharAndSwitchToState( State.PathRootless );

			} else {
				captureMatchIfValidAndReset();
			}
		}


		function statePathRootlessDot( char: string ) {
			if( char === '.' ) {
				// We've read two dots in a rootless path such as 'hello:wor..ld'
				// Generally don't want to accept this kind of match.
				resetToNonUrlState();

			} else if( isPChar( char ) ) {
				captureCharAndSwitchToState( State.PathRootless );

			// TODO: Do we want to accept a URL suffix after a '.'?
			// } else if( isUrlSuffixStartChar( char ) ) {
			// 	readUrlSuffix();

			} else {
				captureMatchIfValidAndReset();
			}
		}


		/**
		 * Handles the end of the "authority" component state. We have already 
		 * read the Authority at this point from the {@link #readAuthority}
		 * function.
		 */
		function stateEndOfAuthority( char: string ) {
			if( isUrlSuffixStartChar( char ) ) {
				readUrlSuffix();

			} else {
				captureMatchIfValidAndReset();
			}
		}


		/**
		 * Handles the end of the "URL Suffix" state. We have already read the
		 * URL suffix at this point from the {@link #readUrlSuffix} function.
		 */
		function stateEndOfUrlSuffix( char: string ) {
			// At this point, there is nothing left to read from the URL
			captureMatchIfValidAndReset();
		}


		function beginUrl(
			newState: State.SchemeChar,
			currentUrlOptions: Partial<CurrentUrl> = {}
		) {
			state = newState;
			currentUrl = new CurrentUrl( { ...currentUrlOptions, idx: charIdx } );
		}

		function resetToNonUrlState() {
			switchToState( State.NonUrl );
			currentUrl = noCurrentUrl
		}


		/**
		 * Switches to the given `state`.
		 * 
		 * If the character read is also a "confirmed URL character", use
		 * {@link #captureCharAndSwitchToState} instead.
		 */
		function switchToState( newState: State ) {
			state = newState;
		}


		/**
		 * Switches to the given `state` and also captures the current character
		 * as a "confirmed URL character"
		 */
		function captureCharAndSwitchToState( newState: State ) {
			switchToState( newState );
			currentUrl = new CurrentUrl( { ...currentUrl, lastConfirmedUrlCharIdx: charIdx } );
		}

		/**
		 * When we have read a "scheme-name://" sequence, and an 'authority' 
		 * start character is read, we read the authority component of the URI.
		 * 
		 * See https://tools.ietf.org/html/rfc3986#appendix-A for the definition
		 * of the "authority" component.
		 * 
		 * We'll run a shared subroutine for this part, and extract the 
		 * information about it.
		 */
		function readAuthority() {
			const { 
				isValidAuthority,
				endIdx, 
				lastConfirmedUrlCharIdx
			} = doReadAuthority( text, charIdx );

			// Update the lastConfirmedUrlCharIdx
			currentUrl = new CurrentUrl( { 
				...currentUrl, 
				lastConfirmedUrlCharIdx,
				isAuthorityMatch: true,
				hasValidAuthority: isValidAuthority
			 } );

			// Advance the character index to the last character read by the
			// doReadAuthority() routine
			charIdx = endIdx;

			switchToState( State.EndOfAuthority );
		}


		/**
		 * When a '/', '?', or '#' character is encountered after the 
		 * "authority" component, this begins the URL suffix (path, query, or 
		 * hash part of the URL). 
		 * 
		 * We'll run a shared subroutine for this part, and extract the 
		 * information about it.
		 */
		function readUrlSuffix() {
			const { 
				endIdx, 
				lastConfirmedUrlCharIdx 
			} = doReadUrlSuffix( text, charIdx );

			// Update the lastConfirmedUrlCharIdx
			currentUrl = new CurrentUrl( { ...currentUrl, lastConfirmedUrlCharIdx } );

			// Advance the character index to the last read character by the
			// doParseUrlSuffix() routine
			charIdx = endIdx;
			
			switchToState( State.EndOfUrlSuffix );
		}


		/*
		 * Captures the current URL as a UrlMatch if it's valid, and resets the 
		 * state to read another URL.
		 * 
		 * This is usually called when we have read a character that is no longer
		 * valid in the current URL. When this happens, we want to capture the
		 * current match if it is valid, but if it's not, we want to reset back
		 * to the "NonUrl" state either way.
		 */
		function captureMatchIfValidAndReset() {
			captureMatchIfValid();

			resetToNonUrlState();
		}


		/*
		 * Captures a match if it is valid (i.e. has a colon and a character 
		 * after it). If a match is not valid, it is possible that we want to 
		 * keep reading characters in order to make a full match.
		 */
		function captureMatchIfValid() {
			if( currentUrl.isValid() ) {
				let url = text.slice( currentUrl.idx, currentUrl.lastConfirmedUrlCharIdx + 1 );

				// For debugging: search for and uncomment other "For debugging" lines
				table.push( 
					[ charIdx, 'capturing', url ] 
				);

				matches.push( new UrlMatch( {
					tagBuilder            : tagBuilder,
					matchedText           : url,
					offset                : currentUrl.idx,
					urlMatchType          : 'scheme',
					url                   : url,
					protocolUrlMatch      : true,   // in this Matcher, we only match TLDs with protocols (schemes)
					protocolRelativeMatch : false,  // in this Matcher, we only match valid schemes. Protocol-relative matches are handled by the TldUrlMatcher
					stripPrefix           : stripPrefix,
					stripTrailingSlash    : stripTrailingSlash,
					decodePercentEncoding : decodePercentEncoding,
				} ) );
			}
		}
	}

}

// TODO: const enum
enum State {
	NonUrl = 0,

	// Scheme states
	SchemeChar,      // First char must be an ASCII letter. Subsequent characters can be: ALPHA / DIGIT / "+" / "-" / "."
	SchemeColon,     // Once we've reached the colon character after a scheme name
	SchemeSlash1,             
	SchemeSlash2,

	PathRootless,    // In a URI such as 'my-scheme:hello', the 'h' will be the beginning of a "rootless" path
	PathRootlessDot, // In a URI such as 'my-scheme:hello..world', the first '.' will put the machine in this state. However, when we read the second '.', we will drop the match (we don't want two dots in this part of a rootless path)

	EndOfAuthority,  // After reading two //'s after the scheme colon, we read the "authority" component of the URI, and then we are in this state
	EndOfUrlSuffix   // After reading a '/', '?', or '#', we read the "URL Suffix" of the URI, and then we are in this state
}


class CurrentUrl {
	readonly idx: number;  // the index of the first character in the URL
	readonly lastConfirmedUrlCharIdx: number;  // the index of the last character that was read that was a URL character for sure. For example, while reading "asdf.com-", the last confirmed char will be the 'm', and the current char would be '-' which *may* form an additional part of the URL
	readonly hasCharAfterColon: boolean;  // we've read a character after the scheme colon character, which will determine if it is a valid match
	readonly isAuthorityMatch: boolean;   // if the scheme matches an "authority" URI (i.e. has two slashes after the colon, such as 'http://')
	readonly hasValidAuthority: boolean;  // if it is an "authority" URI (see isAuthorityMatch), then we want to make sure it is a valid authority. An invalidly formatted IP address would be an invalid authority, for instance

	constructor( cfg: Partial<CurrentUrl> = {} ) {
		this.idx = isUndefined( cfg.idx ) ? -1 : cfg.idx;
		this.lastConfirmedUrlCharIdx = isUndefined( cfg.lastConfirmedUrlCharIdx ) ? this.idx : cfg.lastConfirmedUrlCharIdx;
		this.hasCharAfterColon = !!cfg.hasCharAfterColon;
		this.isAuthorityMatch = !!cfg.isAuthorityMatch;
		this.hasValidAuthority = !!cfg.hasValidAuthority;
	}

	/*
	 * Determines if the current URL that is being read is a valid URL.
	 * 
	 * We want to make sure there is a character after the scheme's colon 
	 * character, and if it is an authority match, we want to make sure that it
	 * has a valid authority. An invalid authority could be if an IP address is
	 * specified but it is invalidly formatted.
	 */
	isValid() {
		return this.hasCharAfterColon && 
		     ( !this.isAuthorityMatch || ( this.isAuthorityMatch && this.hasValidAuthority ) );
	}
}